import { useState, useRef, useEffect, useCallback } from 'react'
import { useStore } from '../stores/useStore'
import {
  X,
  Plus,
  Trash2,
  Pencil,
  Check,
  Layers,
  FolderOpen,
  Clock,
} from 'lucide-react'
import type { WorkspaceProfile } from '../types'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function WorkspaceProfiles() {
  const profilesOpen = useStore((s) => s.profilesOpen)
  const setProfilesOpen = useStore((s) => s.setProfilesOpen)
  const profiles = useStore((s) => s.profiles)
  const saveProfile = useStore((s) => s.saveProfile)
  const loadProfile = useStore((s) => s.loadProfile)
  const renameProfile = useStore((s) => s.renameProfile)
  const deleteProfile = useStore((s) => s.deleteProfile)

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (creating && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [creating])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId])

  const handleCreate = useCallback(() => {
    if (newName.trim()) {
      saveProfile(newName.trim())
      setNewName('')
      setCreating(false)
    }
  }, [newName, saveProfile])

  const handleRename = useCallback((id: string) => {
    if (editName.trim()) {
      renameProfile(id, editName.trim())
      setEditingId(null)
    }
  }, [editName, renameProfile])

  const handleLoad = useCallback((profile: WorkspaceProfile) => {
    loadProfile(profile.id)
    setProfilesOpen(false)
  }, [loadProfile, setProfilesOpen])

  if (!profilesOpen) return null

  return (
    <div
      className="floating-panel"
      style={{
        position: 'fixed',
        top: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 28,
        width: 420,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
        <Layers size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Workspace Profiles</span>
        <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{profiles.length} saved</span>
        <div style={{ flex: 1 }} />
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 11.5, fontWeight: 500, cursor: 'pointer' }}
          >
            <Plus size={13} /> Save Current
          </button>
        )}
        <button
          onClick={() => setProfilesOpen(false)}
          style={{ display: 'flex', padding: 3, borderRadius: 4, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <X size={14} />
        </button>
      </div>

      {/* Create new */}
      {creating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-tertiary)' }}>
          <input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
              if (e.key === 'Escape') { setCreating(false); setNewName('') }
            }}
            placeholder="Profile name (e.g. Work, Personal)"
            style={{
              flex: 1,
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '5px 8px',
              fontSize: 12,
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim()}
            style={{ display: 'flex', padding: 4, borderRadius: 4, background: 'var(--accent)', color: '#fff', border: 'none', cursor: newName.trim() ? 'pointer' : 'default', opacity: newName.trim() ? 1 : 0.4 }}
          >
            <Check size={14} />
          </button>
          <button
            onClick={() => { setCreating(false); setNewName('') }}
            style={{ display: 'flex', padding: 4, borderRadius: 4, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Profile list */}
      <div style={{ flex: 1, overflow: 'auto', padding: 6 }}>
        {profiles.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: 8, fontSize: 12 }}>
            <Layers size={32} style={{ opacity: 0.2 }} />
            <span>No profiles saved yet</span>
            <span style={{ fontSize: 11, opacity: 0.6 }}>Save your current layout as a profile to switch later</span>
          </div>
        ) : (
          profiles.map((profile) => (
            <div
              key={profile.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                marginBottom: 2,
              }}
              onClick={() => handleLoad(profile)}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-sm)',
                background: `linear-gradient(135deg, ${profile.ui.accentColor}33, ${profile.ui.accentColor}11)`,
                border: `1px solid ${profile.ui.accentColor}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Layers size={16} style={{ color: profile.ui.accentColor }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {editingId === profile.id ? (
                  <input
                    ref={editInputRef}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(profile.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onBlur={() => handleRename(profile.id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--accent)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 6px',
                      fontSize: 12.5,
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                ) : (
                  <>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {profile.name}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', display: 'flex', gap: 6, marginTop: 1 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><FolderOpen size={9} />{profile.tabs.length} tabs</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}><Clock size={9} />{formatDate(profile.createdAt)}</span>
                    </div>
                  </>
                )}
              </div>
              {!editingId && (
                <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(profile.id); setEditName(profile.name) }}
                    style={{ display: 'flex', padding: 3, borderRadius: 3, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                    onMouseEnter={(ev) => { ev.currentTarget.style.opacity = '1'; ev.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={(ev) => { ev.currentTarget.style.opacity = '0.5'; ev.currentTarget.style.background = 'transparent' }}
                    title="Rename"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteProfile(profile.id) }}
                    style={{ display: 'flex', padding: 3, borderRadius: 3, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.5 }}
                    onMouseEnter={(ev) => { ev.currentTarget.style.opacity = '1'; ev.currentTarget.style.background = 'var(--bg-hover)' }}
                    onMouseLeave={(ev) => { ev.currentTarget.style.opacity = '0.5'; ev.currentTarget.style.background = 'transparent' }}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '5px 14px', borderTop: '1px solid var(--border-subtle)', fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
        Click a profile to load it &middot; Saves tabs, UI theme, and settings
      </div>
    </div>
  )
}
