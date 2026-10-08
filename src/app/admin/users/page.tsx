'use client'

import React, { useState, useEffect } from 'react'
import { Users, Mail, Phone, Calendar, ShoppingBag, ShieldCheck } from 'lucide-react'

type User = {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  mobileNumber: string | null
  role: string
  createdAt: string
  _count: { orders: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users')
        const data = await res.json()
        if (data.users) setUsers(data.users)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Registered Accounts &amp; Customers
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Directory of registered boutique customers, VIP clients, and staff roles.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-zinc-500">Loading user registry...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-white">No registered users found</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider bg-zinc-950/40">
                  <th className="py-3 px-4 font-semibold">User</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold">Contact Info</th>
                  <th className="py-3 px-4 font-semibold">Orders Count</th>
                  <th className="py-3 px-4 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">
                        {u.firstName || 'Unnamed'} {u.lastName || ''}
                      </div>
                      <span className="font-mono text-[10px] text-zinc-500">{u.id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : u.role === 'STAFF'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-zinc-800 text-zinc-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" />
                        <span>{u.email || 'No email'}</span>
                      </div>
                      {u.mobileNumber && (
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{u.mobileNumber}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-white bg-zinc-800 px-2 py-0.5 rounded">
                        {u._count.orders} orders
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
