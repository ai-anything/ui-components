import "./table-theme.css";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type TableColumn<T> = {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string; // e.g. '120px', '20%'
  wrap?: 'normal' | 'nowrap' | 'break-word'; // NEW: wrapping style
  filterable?: boolean;
  type?: 'string' | 'date' | 'integer' | 'html'; // Added 'html' type
  renderHTML?: boolean; // NEW: flag to use renderHTML utility
  sticky?: boolean; // NEW: sticky column support
  // --- NEW ---
  filterType?: 'search' | 'dropdown' | 'date' | 'integer'; // filter UI type
  filterOptions?: string[]; // for dropdown filter
};

export type TableProps<T> = {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
  style?: React.CSSProperties;
  striped?: boolean;
  hoverable?: boolean;
  enableColumnChooser?: boolean;
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableFullscreen?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  /**
   * Array of column keys to HIDE by default (e.g. last8Keys)
   */
  defaultHiddenColumns?: (keyof T)[];
  stickyColumnCount?: number; // NEW: number of sticky columns from the left
};

export function Table<T extends object>({
  columns,
  data,
  className = "",
  style = {},
  striped = true,
  hoverable = true,
  enableColumnChooser = true,
  enableSearch = true,
  enableFilters = true,
  enableFullscreen = true,
  enablePagination = false,
  pageSize = 10,
  defaultHiddenColumns = [],
  stickyColumnCount = 0, // NEW
}: TableProps<T>) {
  // Column chooser state
  const [visibleCols, setVisibleCols] = useState<Set<keyof T>>(
    () => {
      if (!defaultHiddenColumns || defaultHiddenColumns.length === 0) {
        return new Set(columns.map((c) => c.key));
      }
      return new Set(columns.map((c) => c.key).filter((key) => !defaultHiddenColumns.includes(key)));
    }
  );
  // Search state
  const [search, setSearch] = useState("");
  // Per-column filter state
  const [filters, setFilters] = useState<FilterState>({});
  // Fullscreen state
  const [fullscreen, setFullscreen] = useState(false);
  // Dropdown state for column chooser
  const [colDropdownOpen, setColDropdownOpen] = useState(false);
  // Local filter toggle state
  const [showFilters, setShowFilters] = useState(false); // Hide filters by default
  // Sorting state
  const [sort, setSort] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSize);
  const allSelected = visibleCols.size === columns.length;

  // Filtered and searched data
  const filteredData = useMemo(() => {
    let filtered = data;
    // Global search
    if (search.trim()) {
      filtered = filtered.filter((row) =>
        Array.from(visibleCols).some((key) =>
          String(row[key]).toLowerCase().includes(search.toLowerCase())
        )
      );
    }
    // Per-column filters
    columns.forEach((col) => {
      if (!filters[String(col.key)] || !filters[String(col.key)].value) return;
      const filter = filters[String(col.key)];
      if (col.type === 'date') {
        const rowDate = (row: T) => row[col.key] ? new Date(row[col.key] as any) : null;
        if (filter.op === 'range' && typeof filter.value === 'string' && filter.value && filter.value2 && typeof filter.value2 === 'string') {
          filtered = filtered.filter((row) => {
            const d = rowDate(row);
            return d && d >= new Date(filter.value as string) && d <= new Date(filter.value2 as string);
          });
        } else if (filter.op === 'before' && typeof filter.value === 'string' && filter.value) {
          filtered = filtered.filter((row) => {
            const d = rowDate(row);
            return d && d < new Date(filter.value as string);
          });
        } else if (filter.op === 'after' && typeof filter.value === 'string' && filter.value) {
          filtered = filtered.filter((row) => {
            const d = rowDate(row);
            return d && d > new Date(filter.value as string);
          });
        }
      } else if (col.type === 'integer') {
        const rowVal = (row: T) => Number(row[col.key]);
        const filterVal = Number(filter.value);
        if (filter.op === '=' && filter.value) {
          filtered = filtered.filter((row) => rowVal(row) === filterVal);
        } else if (filter.op === '<' && filter.value) {
          filtered = filtered.filter((row) => rowVal(row) < filterVal);
        } else if (filter.op === '>' && filter.value) {
          filtered = filtered.filter((row) => rowVal(row) > filterVal);
        }
      } else if (col.filterType === 'dropdown') {
        // --- NEW: multiselect logic ---
        const selected = getDropdownFilterValue(filter.value);
        if (selected.length > 0) {
          filtered = filtered.filter((row) => selected.includes(String(row[col.key])));
        }
      } else {
        // string default: contains
        if (typeof filter.value === 'string') {
          filtered = filtered.filter((row) =>
            String(row[col.key]).toLowerCase().includes(filter.value.toLowerCase())
          );
        }
      }
    });
    return filtered;
  }, [data, search, filters, visibleCols, columns]);

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sort) return filteredData;
    const sorted = [...filteredData].sort((a, b) => {
      const aValue = a[sort.key];
      const bValue = b[sort.key];
      if (aValue == null) return 1;
      if (bValue == null) return -1;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sort.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return sort.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
    return sorted;
  }, [filteredData, sort]);

  // Handle column chooser
  const handleColToggle = (key: keyof T) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (allSelected) setVisibleCols(new Set());
    else setVisibleCols(new Set(columns.map((c) => c.key)));
  };

  // Handle fullscreen
  const tableContainerClass = `${fullscreen ? "fixed inset-0 z-50 bg-table-bg bg-opacity-95 p-8 overflow-auto" : ""}`;

  // Utility: safely render HTML in a cell
  function renderHTML(html: string): React.ReactElement {
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }

  // Utility: get a cell renderer for HTML content
  function htmlCellRenderer<T>(key: keyof T): (value: T[keyof T], row: T) => React.ReactNode {
    return (value) => typeof value === 'string' ? renderHTML(value) : String(value);
  }

  // Attach utilities to Table
  (Table as any).renderHTML = renderHTML;
  (Table as any).htmlCellRenderer = htmlCellRenderer;

  const pageCount = Math.max(1, Math.ceil(sortedData.length / rowsPerPage));
  const pagedData = enablePagination
    ? sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage)
    : sortedData;

  // --- NEW: Memoize unique values for dropdowns ---
  const columnDropdownOptions = useMemo(() => {
    const options: { [key: string]: string[] } = {};
    columns.forEach((col) => {
      if (col.filterType === 'dropdown' && !col.filterOptions) {
        const values = Array.from(new Set(data.map((row) => String(row[col.key])))).filter(v => v !== undefined && v !== null && v !== '');
        options[String(col.key)] = values.sort();
      }
    });
    return options;
  }, [columns, data]);

  // --- NEW: Helper for dropdown filter value ---
  function getDropdownFilterValue(val: string | string[] | undefined): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val ? [val] : [];
    return [];
  }

  // --- NEW: MultiSelectDropdown component for filter UI ---
  type MultiSelectDropdownProps = {
    options: string[];
    value: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    style?: React.CSSProperties;
  };

  function MultiSelectDropdown({ options, value, onChange, placeholder = 'Select...', style = {} }: MultiSelectDropdownProps) {
    const [open, setOpen] = useState(false);
    const allSelected = value.length === options.length && options.length > 0;
    const btnRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null); // NEW: menu ref
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (open && btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        setMenuStyle({
          position: 'fixed',
          top: rect.bottom + 2,
          left: rect.left,
          minWidth: rect.width,
          zIndex: 9999,
        });
      }
    }, [open]);

    // Only update value, do not close dropdown
    const handleSelect = (option: string) => {
      if (value.includes(option)) {
        onChange(value.filter((v) => v !== option));
      } else {
        onChange([...value, option]);
      }
    };

    const handleSelectAll = () => {
      if (allSelected) {
        onChange([]);
      } else {
        onChange([...options]);
      }
    };

    // Close on click outside (use capture phase to ensure menu handlers run first)
    useEffect(() => {
      if (!open) return;
      function handle(e: MouseEvent) {
        if (
          (btnRef.current && btnRef.current.contains(e.target as Node)) ||
          (menuRef.current && menuRef.current.contains(e.target as Node))
        ) {
          return;
        }
        setOpen(false);
      }
      document.addEventListener('mousedown', handle, true); // capture phase
      return () => document.removeEventListener('mousedown', handle, true);
    }, [open]);

    // Close on Escape key
    useEffect(() => {
      if (!open) return;
      function handleKey(e: KeyboardEvent) {
        if (e.key === 'Escape') setOpen(false);
      }
      document.addEventListener('keydown', handleKey);
      return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    return (
      <>
        <div
          ref={btnRef}
          className="border border-table-border rounded bg-table-bg text-xs px-2 py-1 cursor-pointer flex items-center justify-between"
          onClick={() => setOpen((o) => !o)}
          tabIndex={0}
          style={{ minHeight: 28, minWidth: 120, ...style }}
        >
          <span className="truncate" style={{ maxWidth: 80 }}>
            {value.length === 0 ? (
              <span className="text-table-muted">{placeholder}</span>
            ) : value.length === 1 ? (
              value[0]
            ) : (
              `${value.length} selected`
            )}
          </span>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="ml-1">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.4a.75.75 0 01-1.08 0l-4.24-4.4a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
        {open && mounted && createPortal(
          <div
            ref={menuRef}
            data-dropdown-menu="true"
            className="border border-table-border rounded bg-table-bg shadow text-xs"
            style={{ ...menuStyle, maxHeight: 192, overflowY: 'auto' }}
            onMouseDown={e => e.stopPropagation()}
          >
            <div
              className="px-2 py-1 border-b border-table-border cursor-pointer hover:bg-table-row-hover flex items-center gap-2"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); handleSelectAll(); }}
            >
              <input type="checkbox" checked={allSelected} readOnly className="accent-table-header mr-1" />
              <span>{allSelected ? 'Unselect All' : 'Select All'}</span>
            </div>
            {options.map((opt) => (
              <div
                key={opt}
                className="px-2 py-1 cursor-pointer hover:bg-table-row-hover flex items-center gap-2"
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); handleSelect(opt); }}
              >
                <input type="checkbox" checked={value.includes(opt)} readOnly className="accent-table-header mr-1" />
                <span className="truncate" title={opt}>{opt}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
      </>
    );
  }

  return (
    <div className={tableContainerClass} style={style}>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-2 justify-between">
        <div />
        <div className="flex flex-wrap items-center gap-2">
          {enableSearch && (
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-2 py-1 border border-table-border rounded bg-table-header-bg text-table-header text-xs"
              style={{ minWidth: 120 }}
            />
          )}
          {enableFilters && (
            <button
              type="button"
              onClick={() => setShowFilters((f) => !f)}
              className="px-2 py-1 border border-table-border rounded bg-table-header-bg text-table-header text-xs"
            >
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          )}
          {enableColumnChooser && (
            <div className="relative">
              <button
                type="button"
                className="px-2 py-1 border border-table-border rounded bg-table-header-bg text-table-header text-xs flex items-center gap-1"
                onClick={() => setColDropdownOpen((o) => !o)}
              >
                Columns
                <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="inline ml-1"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.855a.75.75 0 111.08 1.04l-4.24 4.4a.75.75 0 01-1.08 0l-4.24-4.4a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
              </button>
              {colDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-table-bg border border-table-border rounded shadow z-10 p-2">
                  <label className="flex items-center text-xs cursor-pointer mb-1">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="mr-1 accent-table-header"
                    />
                    <span className="font-semibold">All</span>
                  </label>
                  <div className="max-h-40 overflow-y-auto">
                    {columns.map((col) => (
                      <label key={String(col.key)} className="flex items-center text-xs cursor-pointer mb-1">
                        <input
                          type="checkbox"
                          checked={visibleCols.has(col.key)}
                          onChange={() => handleColToggle(col.key)}
                          className="mr-1 accent-table-header"
                        />
                        {col.header}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {enableFullscreen && (
            <button
              onClick={() => setFullscreen((f) => !f)}
              className="px-2 py-1 border border-table-border rounded bg-table-header-bg text-table-header text-xs"
            >
              {fullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          )}
        </div>
      </div>
      <div className={`overflow-x-auto rounded-lg border border-table-border bg-table-bg shadow-sm ${className}` + (fullscreen ? "" : "") } style={{ overflowX: 'auto', width: '100%' }}>
        <table className="min-w-full text-sm" style={{ tableLayout: 'auto', width: 'max-content', minWidth: '100%' }}>
          <thead>
            <tr>
              {columns.filter((col) => visibleCols.has(col.key)).map((col, colIdx, arr) => {
                const isSorted = sort && sort.key === col.key;
                // For nowrap, set minWidth and whiteSpace
                const thStyle = {
                  width: col.width,
                  minWidth: col.wrap === 'nowrap' ? (col.width || '90px') : undefined,
                  whiteSpace: col.wrap === 'nowrap' ? 'nowrap' : col.wrap === 'break-word' ? 'normal' : undefined,
                  wordBreak: col.wrap === 'break-word' ? 'break-word' as React.CSSProperties['wordBreak'] : undefined,
                  maxWidth: col.width ? col.width : '750px',
                  position: stickyColumnCount > 0 && colIdx < stickyColumnCount ? 'sticky' as React.CSSProperties['position'] : undefined,
                  left: stickyColumnCount > 0 && colIdx < stickyColumnCount ? `${getStickyLeft(arr, colIdx)}px` : undefined,
                  zIndex: stickyColumnCount > 0 && colIdx < stickyColumnCount ? 3 : undefined,
                  background: stickyColumnCount > 0 && colIdx < stickyColumnCount ? '#fff' : undefined,
                };
                return (
                  <th
                    key={String(col.key)}
                    className="px-4 py-2 text-left font-semibold text-table-header border-b border-table-border bg-table-header-bg cursor-pointer select-none"
                    style={thStyle}
                    onClick={() => {
                      setSort((prev) => {
                        if (!prev || prev.key !== col.key) return { key: col.key, direction: 'asc' };
                        if (prev.direction === 'asc') return { key: col.key, direction: 'desc' };
                        return null; // Remove sort
                      });
                    }}
                  >
                    <span className="flex items-center gap-1">
                      {col.header}
                      {isSorted && (
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="inline">
                          {sort.direction === 'asc' ? (
                            <path fillRule="evenodd" d="M10 5a1 1 0 01.7.3l4 4a1 1 0 01-1.4 1.4L10 7.42l-3.3 3.28a1 1 0 01-1.4-1.4l4-4A1 1 0 0110 5z" clipRule="evenodd" />
                          ) : (
                            <path fillRule="evenodd" d="M10 15a1 1 0 01-.7-.3l-4-4a1 1 0 011.4-1.4L10 12.58l3.3-3.28a1 1 0 011.4 1.4l-4 4A1 1 0 0110 15z" clipRule="evenodd" />
                          )}
                        </svg>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
            {showFilters && (
              <tr>
                {columns.filter((col) => visibleCols.has(col.key)).map((col, colIdx, arr) => {
                  const filterThStyle = {
                    width: col.width,
                    minWidth: col.wrap === 'nowrap' ? (col.width || '120px') : undefined,
                    whiteSpace: col.wrap === 'nowrap' ? 'nowrap' : col.wrap === 'break-word' ? 'normal' : undefined,
                    wordBreak: col.wrap === 'break-word' ? 'break-word' as React.CSSProperties['wordBreak'] : undefined,
                    maxWidth: col.width ? col.width : '750px',
                    position: stickyColumnCount > 0 && colIdx < stickyColumnCount ? 'sticky' as React.CSSProperties['position'] : undefined,
                    left: stickyColumnCount > 0 && colIdx < stickyColumnCount ? `${getStickyLeft(arr, colIdx)}px` : undefined,
                    zIndex: stickyColumnCount > 0 && colIdx < stickyColumnCount ? 3 : undefined,
                    background: stickyColumnCount > 0 && colIdx < stickyColumnCount ? '#fff' : undefined,
                  };
                  // --- NEW: filterType logic ---
                  const filterType = col.filterType || (col.type === 'date' ? 'date' : col.type === 'integer' ? 'integer' : 'search');
                  // --- NEW: get dropdown options ---
                  const dropdownOptions = col.filterType === 'dropdown' ? (col.filterOptions || columnDropdownOptions[String(col.key)] || []) : [];
                  if (col.filterType === 'dropdown') {
                    console.log('Dropdown filter for column', col.key, 'options:', dropdownOptions);
                  }
                  return (
                    <th key={String(col.key)} className="px-4 py-1 border-b border-table-border bg-table-header-bg" style={filterThStyle}>
                      {col.filterable !== false ? (
                        filterType === 'dropdown' && dropdownOptions.length > 0 ? (
                          <MultiSelectDropdown
                            options={dropdownOptions}
                            value={getDropdownFilterValue(filters[String(col.key)]?.value)}
                            onChange={(selected) => setFilters(prev => ({
                              ...prev,
                              [String(col.key)]: { op: 'in', value: selected }
                            }))}
                            placeholder={`Filter`}
                          />
                        ) : filterType === 'date' ? (
                          <div className="flex flex-col gap-1">
                            <select
                              className="mb-1 text-xs border border-table-border rounded"
                              value={filters[String(col.key)]?.op || 'range'}
                              onChange={e => setFilters(prev => ({
                                ...prev,
                                [String(col.key)]: { ...prev[String(col.key)], op: e.target.value, value: '', value2: '' }
                              }))}
                            >
                              <option value="range">Range</option>
                              <option value="before">Before</option>
                              <option value="after">After</option>
                            </select>
                            {(() => {
                              const op = filters[String(col.key)]?.op || 'range';
                              if (op === 'range') {
                                return (
                                  <div className="flex gap-1">
                                    <input
                                      type="date"
                                      className="w-full text-xs border border-table-border rounded"
                                      value={filters[String(col.key)]?.value || ''}
                                      onChange={e => setFilters(prev => ({
                                        ...prev,
                                        [String(col.key)]: { ...prev[String(col.key)], op, value: e.target.value }
                                      }))}
                                    />
                                    <span className="mx-1">-</span>
                                    <input
                                      type="date"
                                      className="w-full text-xs border border-table-border rounded"
                                      value={filters[String(col.key)]?.value2 || ''}
                                      onChange={e => setFilters(prev => ({
                                        ...prev,
                                        [String(col.key)]: { ...prev[String(col.key)], op, value2: e.target.value }
                                      }))}
                                    />
                                  </div>
                                );
                              } else {
                                return (
                                  <input
                                    type="date"
                                    className="w-full text-xs border border-table-border rounded"
                                    value={filters[String(col.key)]?.value || ''}
                                    onChange={e => setFilters(prev => ({
                                      ...prev,
                                      [String(col.key)]: { ...prev[String(col.key)], op, value: e.target.value }
                                    }))}
                                  />
                                );
                              }
                            })()}
                          </div>
                        ) : filterType === 'integer' ? (
                          <div className="flex gap-1">
                            <select
                              className="text-xs border border-table-border rounded"
                              value={filters[String(col.key)]?.op || '='}
                              onChange={e => setFilters(prev => ({
                                ...prev,
                                [String(col.key)]: { ...prev[String(col.key)], op: e.target.value }
                              }))}
                            >
                              <option value="=">=</option>
                              <option value=">">&gt;</option>
                              <option value="<">&lt;</option>
                            </select>
                            <input
                              type="number"
                              className="w-full text-xs border border-table-border rounded"
                              value={filters[String(col.key)]?.value || ''}
                              onChange={e => setFilters(prev => ({
                                ...prev,
                                [String(col.key)]: { ...prev[String(col.key)], op: filters[String(col.key)]?.op || '=', value: e.target.value }
                              }))}
                            />
                          </div>
                        ) : (
                          // Default: search string
                          <input
                            type="text"
                            placeholder={`Filter`}
                            value={filters[String(col.key)]?.value || ''}
                            onChange={(e) => setFilters((prev) => ({ ...prev, [String(col.key)]: { op: 'contains', value: e.target.value } }))}
                            className="w-full px-1 py-0.5 border border-table-border rounded bg-table-bg text-table-cell text-xs transition-all duration-200"
                            style={{ width: '100%' }}
                          />
                        )
                      ) : null}
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td colSpan={Array.from(visibleCols).length} className="px-4 py-4 text-center text-table-muted">
                  No data available
                </td>
              </tr>
            ) : (
              pagedData.map((row, i) => (
                <tr
                  key={i}
                  className={`transition-colors ${
                    striped && i % 2 === 1 ? "bg-table-row-alt" : ""
                  } ${hoverable ? "hover:bg-table-row-hover" : ""}`}
                >
                  {columns.filter((col) => visibleCols.has(col.key)).map((col, colIdx, arr) => {
                    const tdStyle = {
                      width: col.width,
                      minWidth: col.wrap === 'nowrap' ? (col.width || '120px') : undefined,
                      whiteSpace: col.wrap === 'nowrap' ? 'nowrap' : col.wrap === 'break-word' ? 'normal' : undefined,
                      wordBreak: col.wrap === 'break-word' ? 'break-word' as React.CSSProperties['wordBreak'] : undefined,
                      maxWidth: col.width ? col.width : '750px',
                      position: stickyColumnCount > 0 && colIdx < stickyColumnCount ? 'sticky' as React.CSSProperties['position'] : undefined,
                      left: stickyColumnCount > 0 && colIdx < stickyColumnCount ? `${getStickyLeft(arr, colIdx)}px` : undefined,
                      zIndex: stickyColumnCount > 0 && colIdx < stickyColumnCount ? 2 : undefined,
                      background: stickyColumnCount > 0 && colIdx < stickyColumnCount ? '#fff' : undefined,
                    };
                    return (
                      <td
                        key={String(col.key)}
                        className="px-4 py-2 border-b border-table-border text-table-cell"
                        style={{
                          ...tdStyle,
                          verticalAlign: 'top',
                          position: tdStyle.position as React.CSSProperties['position'],
                        }}
                      >
                        {col.renderHTML || col.type === 'html'
                          ? renderHTML(String(row[col.key]))
                          : col.render
                          ? col.render(row[col.key], row)
                          : (row[col.key] as React.ReactNode)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {enablePagination && (
        <div className="flex flex-wrap justify-between items-center gap-2 mt-4">
          <div className="flex items-center gap-2">
            <label htmlFor="rows-per-page" className="text-table-header text-xs">Rows per page:</label>
            <select
              id="rows-per-page"
              className="px-2 py-1 border border-table-border rounded bg-table-header-bg text-table-header text-xs"
              value={rowsPerPage}
              onChange={e => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 20, 50, 100].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 border border-table-border rounded bg-table-header-bg text-table-header text-xs disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-table-header text-xs">Page {page} of {pageCount}</span>
            <button
              className="px-2 py-1 border border-table-border rounded bg-table-header-bg text-table-header text-xs disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default Table;

// Utility to calculate left offset for sticky columns
function getStickyLeft<T>(cols: TableColumn<T>[], idx: number): number {
  let left = 0;
  for (let i = 0; i < idx; i++) {
    const col = cols[i];
    // Use width or fallback to 120px
    let w = 120;
    if (col.width && col.width.endsWith('px')) w = parseInt(col.width);
    else if (col.width && col.width.endsWith('%')) w = 120; // fallback for %
    left += w;
  }
  return left;
}

// Fix: FilterState type definition for filters state
// (This was missing and caused a compile error)
type FilterState = {
  [key: string]: {
    op: string;
    value: string | string[];
    value2?: string;
  };
};

// Fix: style type errors for position and wordBreak
// (Apply casts where needed)
// Example usage in thead/tr and tbody/td:
// ...
// style={{ ...filterThStyle, position: 'relative' as React.CSSProperties['position'], zIndex: 30 }}
// ...
// style={{ ...tdStyle, verticalAlign: 'top', position: tdStyle.position as React.CSSProperties['position'] }}
// ...
// In filterThStyle, thStyle, tdStyle definitions:
// position: ... as React.CSSProperties['position'],
// wordBreak: ... as React.CSSProperties['wordBreak'],
//
