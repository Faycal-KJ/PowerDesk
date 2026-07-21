package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"time"
)

type FileEntry struct {
	Name        string `json:"name"`
	Path        string `json:"path"`
	IsDirectory bool   `json:"isDirectory"`
	Size        int64  `json:"size"`
	ModifiedAt  string `json:"modifiedAt"`
	Extension   string `json:"extension"`
}

var (
	scanned  atomic.Int64
	skipped  atomic.Int64
	writeMu  sync.Mutex
	bufPool  = sync.Pool{New: func() any { return new(bytes.Buffer) }}
	doneCh   = make(chan struct{})
)

var skipDirs = map[string]bool{
	"node_modules": true, ".git": true, ".svn": true, ".hg": true,
	"__pycache__": true, ".cache": true, "vendor": true,
	"bower_components": true, ".next": true, ".nuxt": true,
	"dist": true, "build": true, "target": true,
	"bin": true, "obj": true, ".gradle": true, ".m2": true,
	".npm": true, ".yarn": true, ".pnpm-store": true,
	"AppData": true, "Application Data": true, "Local Settings": true,
	"$Recycle.Bin": true, "System Volume Information": true,
	"Recovery": true, "Windows": true, "WinSxS": true, "Installer": true,
	"MSOCache": true, "Intel": true, "AMD": true, "NVIDIA": true,
	"Temp": true, "tmp": true, "logs": true, "log": true,
}

func isSkipDir(name string) bool {
	if len(name) == 0 {
		return false
	}
	if name[0] == '.' && !strings.HasPrefix(name, "..") {
		return true
	}
	return skipDirs[name]
}

func main() {
	rootsStr := flag.String("roots", "", "Comma-separated root dirs")
	flag.Parse()

	var roots []string
	if *rootsStr != "" {
		for _, r := range strings.Split(*rootsStr, ",") {
			r = strings.TrimSpace(r)
			if r != "" {
				roots = append(roots, r)
			}
		}
	}
	if len(roots) == 0 {
		roots = getDrives()
	}

	runtime.GOMAXPROCS(runtime.NumCPU())

	go progressReporter()

	var wg sync.WaitGroup
	for _, root := range roots {
		wg.Add(1)
		go func(r string) {
			defer wg.Done()
			walkTree(r)
		}(root)
	}
	wg.Wait()

	// Flush done marker
	writeMu.Lock()
	json.NewEncoder(os.Stdout).Encode(map[string]any{
		"_done":    scanned.Load(),
		"_skipped": skipped.Load(),
	})
	writeMu.Unlock()

	close(doneCh)
}

func walkTree(root string) {
	type frame struct {
		path  string
		depth int
	}

	stack := []frame{{path: root, depth: 0}}
	buf := bufPool.Get().(*bytes.Buffer)
	buf.Reset()
	enc := json.NewEncoder(buf)
	count := 0

	flush := func() {
		if buf.Len() == 0 {
			return
		}
		writeMu.Lock()
		os.Stdout.Write(buf.Bytes())
		writeMu.Unlock()
		buf.Reset()
		enc = json.NewEncoder(buf)
	}

	for len(stack) > 0 {
		f := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		entries, err := os.ReadDir(f.path)
		if err != nil {
			continue
		}

		for _, entry := range entries {
			name := entry.Name()
			isDir := entry.IsDir()

			if isDir && isSkipDir(name) {
				skipped.Add(1)
				continue
			}

			fullPath := filepath.Join(f.path, name)
			ext := ""
			if !isDir {
				ext = extLower(name)
			}

			var size int64
			var modTime string
			if info, err := entry.Info(); err == nil {
				size = info.Size()
				modTime = info.ModTime().UTC().Format(time.RFC3339)
			}

			scanned.Add(1)
			enc.Encode(FileEntry{
				Name:        name,
				Path:        fullPath,
				IsDirectory: isDir,
				Size:        size,
				ModifiedAt:  modTime,
				Extension:   ext,
			})
			count++

			if count >= 2000 {
				flush()
				count = 0
			}

			if isDir {
				stack = append(stack, frame{path: fullPath, depth: f.depth + 1})
			}
		}
	}
	flush()
	bufPool.Put(buf)
}

func extLower(name string) string {
	dot := strings.LastIndexByte(name, '.')
	if dot < 0 {
		return ""
	}
	return strings.ToLower(name[dot:])
}

func progressReporter() {
	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	var last int64
	for {
		select {
		case <-ticker.C:
			c := scanned.Load()
			if c > last {
				last = c
				writeMu.Lock()
				json.NewEncoder(os.Stdout).Encode(
					map[string]any{"_progress": c},
				)
				writeMu.Unlock()
			}
		case <-doneCh:
			return
		}
	}
}

func getDrives() []string {
	var drives []string
	for i := 65; i <= 90; i++ {
		p := string(rune(i)) + ":\\"
		if _, err := os.Stat(p); err == nil {
			drives = append(drives, p)
		}
	}
	return drives
}
