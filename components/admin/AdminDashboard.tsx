'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { logoutAction } from '@/app/actions/auth'
import PhotoModal from './PhotoModal'

interface Photo {
  id: string
  image_url: string
  created_at: string
}

interface Filters {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
}

const PAGE_SIZE_OPTIONS = [10, 20, 50]

export default function AdminDashboard() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [totalAll, setTotalAll] = useState(0)
  const [totalFiltered, setTotalFiltered] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [filters, setFilters] = useState<Filters>({
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
  })
  const [appliedFilters, setAppliedFilters] = useState<Filters>(filters)
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)

  const supabase = createClient()

  useEffect(() => {
    supabase.from('photos').select('id', { count: 'exact', head: true }).then(({ count }) => {
      setTotalAll(count ?? 0)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPhotos = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('photos').select('id, image_url, created_at', { count: 'exact' })

    if (appliedFilters.startDate) {
      const startTs = appliedFilters.startTime
        ? `${appliedFilters.startDate}T${appliedFilters.startTime}:00`
        : `${appliedFilters.startDate}T00:00:00`
      query = query.gte('created_at', startTs)
    }
    if (appliedFilters.endDate) {
      const endTs = appliedFilters.endTime
        ? `${appliedFilters.endDate}T${appliedFilters.endTime}:59`
        : `${appliedFilters.endDate}T23:59:59`
      query = query.lte('created_at', endTs)
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (!error) {
      setPhotos(data ?? [])
      setTotalFiltered(count ?? 0)
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, page, pageSize])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  useEffect(() => {
    setPage(1)
  }, [appliedFilters, pageSize])

  const totalPages = Math.ceil(totalFiltered / pageSize)
  const hasActiveFilter =
    appliedFilters.startDate ||
    appliedFilters.endDate ||
    appliedFilters.startTime ||
    appliedFilters.endTime

  function applyFilters() {
    setAppliedFilters(filters)
  }

  function clearFilters() {
    const empty = { startDate: '', endDate: '', startTime: '', endTime: '' }
    setFilters(empty)
    setAppliedFilters(empty)
  }

  const inputClass =
    'w-full bg-background border border-border px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 transition rounded-none'

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-12 pb-6 border-b border-border">
        <Image
          src="/nex-logo.png"
          alt="NEX"
          width={120}
          height={60}
          className="object-contain"
          priority
        />
        <div className="flex items-center gap-6">
          <span className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">
            Admin Dashboard
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="border border-border text-muted-foreground text-xs px-5 py-2.5 uppercase tracking-widest font-semibold hover:text-foreground hover:border-foreground transition rounded-none"
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-px bg-border mb-10">
        <div className="bg-card p-8">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-3">
            Total Photos
          </p>
          <p className="text-7xl font-black text-foreground leading-none">{totalAll}</p>
        </div>
        <div className="bg-card p-8">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-3">
            {hasActiveFilter ? 'Filtered Results' : 'All Results'}
          </p>
          <p className="text-7xl font-black text-foreground leading-none">{totalFiltered}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border p-6 mb-8">
        <h2 className="text-xs font-semibold text-foreground mb-5 uppercase tracking-widest">
          Filters
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-2 uppercase tracking-widest">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-2 uppercase tracking-widest">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-2 uppercase tracking-widest">
              Start Time
            </label>
            <input
              type="time"
              value={filters.startTime}
              onChange={(e) => setFilters((f) => ({ ...f, startTime: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-2 uppercase tracking-widest">
              End Time
            </label>
            <input
              type="time"
              value={filters.endTime}
              onChange={(e) => setFilters((f) => ({ ...f, endTime: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={applyFilters}
            className="bg-primary text-primary-foreground font-semibold text-xs px-6 py-3 uppercase tracking-widest hover:bg-foreground/80 active:scale-95 transition-all rounded-none"
          >
            Apply Filters
          </button>
          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="border border-border text-muted-foreground text-xs px-6 py-3 uppercase tracking-widest font-semibold hover:text-foreground transition rounded-none"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table controls */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-muted-foreground text-sm">
          {totalFiltered > 0
            ? `Showing ${Math.min((page - 1) * pageSize + 1, totalFiltered)}–${Math.min(page * pageSize, totalFiltered)} of ${totalFiltered}`
            : 'No results'}
        </p>
        <div className="flex items-center gap-3">
          <label className="text-muted-foreground text-xs uppercase tracking-widest">Per page:</label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-background border border-border px-3 py-2 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 rounded-none"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border overflow-hidden mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-widest px-6 py-4">
                Thumbnail
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-widest px-6 py-4">
                ID
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-widest px-6 py-4">
                Date &amp; Time
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="py-20 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : photos.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-20 text-center text-muted-foreground">
                  No photos found
                </td>
              </tr>
            ) : (
              photos.map((photo) => (
                <tr
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="border-b border-border last:border-0 hover:bg-secondary cursor-pointer transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="w-14 h-14 overflow-hidden bg-secondary border border-border flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.image_url}
                        alt="Photo thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-muted-foreground text-xs font-mono">{photo.id}</span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-foreground text-sm">
                      {new Date(photo.created_at).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border border-border px-5 py-2.5 text-xs text-foreground disabled:opacity-30 hover:bg-secondary transition uppercase tracking-widest font-semibold rounded-none"
          >
            Previous
          </button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            const p = i + 1
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 text-sm font-semibold transition rounded-none ${
                  page === p
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-foreground hover:bg-secondary'
                }`}
              >
                {p}
              </button>
            )
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="border border-border px-5 py-2.5 text-xs text-foreground disabled:opacity-30 hover:bg-secondary transition uppercase tracking-widest font-semibold rounded-none"
          >
            Next
          </button>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  )
}
