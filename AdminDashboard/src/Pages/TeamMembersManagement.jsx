import { useCallback, useEffect, useState } from 'react';
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMembers,
  updateTeamMember,
} from '../../adminService';

const emptyForm = {
  name: '',
  role: '',
  bio: '',
  image: '',
  email: '',
  phone: '',
  socials: '[]',
  order: 0,
  isActive: true,
};

function TeamMembersManagement() {
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await getTeamMembers());
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        ...form,
        order: Number(form.order) || 0,
        socials: JSON.parse(form.socials || '[]'),
      };
      if (editingId) {
        await updateTeamMember(editingId, payload);
        setMessage('Team member updated successfully.');
      } else {
        await createTeamMember(payload);
        setMessage('Team member created successfully.');
      }
      resetForm();
      await loadMembers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Failed to save team member. Ensure Social links is valid JSON.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (member) => {
    setEditingId(member.id);
    setForm({
      name: member.name || '',
      role: member.role || '',
      bio: member.bio || '',
      image: member.image || '',
      email: member.email || '',
      phone: member.phone || '',
      socials: JSON.stringify(member.socials || [], null, 2),
      order: member.order || 0,
      isActive: member.isActive !== false,
    });
    setMessage('');
    setError('');
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Delete this team member?')) return;
    setError('');
    try {
      await deleteTeamMember(memberId);
      setMessage('Team member deleted successfully.');
      if (editingId === memberId) resetForm();
      await loadMembers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Failed to delete team member.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2C1810] dark:text-[#F5E6D3]">Team Members</h1>
        <p className="mt-1 text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">Manage the leadership team shown on the public About page.</p>
      </div>

      {message && <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <section className="rounded-xl border border-[#E8D6B5] bg-white p-6 shadow-sm dark:border-[#3A3A3A] dark:bg-[#2A2A2A]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">{editingId ? 'Edit team member' : 'Add team member'}</h2>
            {editingId && <button type="button" onClick={resetForm} className="text-sm font-semibold text-[#8B4513] hover:text-[#D4A017]">Cancel edit</button>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              ['name', 'Name', 'text'],
              ['role', 'Role', 'text'],
              ['image', 'Image URL', 'url'],
              ['email', 'Email', 'email'],
              ['phone', 'Phone', 'tel'],
            ].map(([name, label, type]) => (
              <label key={name} className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017]">
                {label}
                <input name={name} type={type} value={form[name]} onChange={handleChange} required={name === 'name' || name === 'role'} className="mt-1 w-full rounded-lg border border-[#E8D6B5] bg-white px-3 py-2 text-sm text-[#2C1810] focus:border-[#D4A017] focus:outline-none dark:border-[#3A3A3A] dark:bg-[#202020] dark:text-[#F5E6D3]" />
              </label>
            ))}
            <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017]">
              Bio
              <textarea name="bio" value={form.bio} onChange={handleChange} rows={4} className="mt-1 w-full rounded-lg border border-[#E8D6B5] bg-white px-3 py-2 text-sm text-[#2C1810] focus:border-[#D4A017] focus:outline-none dark:border-[#3A3A3A] dark:bg-[#202020] dark:text-[#F5E6D3]" />
            </label>
            <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017]">
              Social links JSON
              <textarea name="socials" value={form.socials} onChange={handleChange} rows={4} placeholder='[{"label":"LinkedIn","href":"https://linkedin.com/..."}]' className="mt-1 w-full rounded-lg border border-[#E8D6B5] bg-white px-3 py-2 font-mono text-xs text-[#2C1810] focus:border-[#D4A017] focus:outline-none dark:border-[#3A3A3A] dark:bg-[#202020] dark:text-[#F5E6D3]" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#8B4513] dark:text-[#D4A017]">
                Display order
                <input name="order" type="number" value={form.order} onChange={handleChange} className="mt-1 w-full rounded-lg border border-[#E8D6B5] bg-white px-3 py-2 text-sm text-[#2C1810] focus:border-[#D4A017] focus:outline-none dark:border-[#3A3A3A] dark:bg-[#202020] dark:text-[#F5E6D3]" />
              </label>
              <label className="flex items-center gap-2 pt-7 text-sm font-medium text-[#8B4513] dark:text-[#D4A017]">
                <input name="isActive" type="checkbox" checked={form.isActive} onChange={handleChange} />
                Visible on About page
              </label>
            </div>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#D4A017] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#B8860B] disabled:opacity-60">
              {saving ? 'Saving...' : editingId ? 'Update team member' : 'Add team member'}
            </button>
          </form>
        </section>

        <section className="space-y-3">
          {loading ? <p className="text-sm text-[#8B4513]">Loading team members...</p> : members.length === 0 ? <p className="rounded-xl border border-dashed border-[#E8D6B5] p-6 text-sm text-[#8B4513]">No team members have been added.</p> : members.map((member) => (
            <article key={member.id} className="rounded-xl border border-[#E8D6B5] bg-white p-4 shadow-sm dark:border-[#3A3A3A] dark:bg-[#2A2A2A]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {member.image ? <img src={member.image} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="h-12 w-12 rounded-full bg-[#F5E6D3]" />}
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-[#2C1810] dark:text-[#F5E6D3]">{member.name}</h3>
                    <p className="text-sm text-[#8B4513] dark:text-[#D4A017]">{member.role}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{member.isActive ? 'Active' : 'Hidden'}</span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-[#8B4513]/80 dark:text-[#D4A017]/80">{member.bio}</p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => handleEdit(member)} className="rounded-lg border border-[#E8D6B5] px-3 py-1.5 text-xs font-semibold text-[#8B4513] hover:border-[#D4A017]">Edit</button>
                <button type="button" onClick={() => handleDelete(member.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

export default TeamMembersManagement;
