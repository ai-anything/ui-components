# Table Component

A flexible, feature-rich React Table component with support for theming, filtering, sorting, column chooser, sticky columns, fullscreen, and pagination.

## Features

- **Customizable columns**: Define headers, renderers, widths, and types.
- **Filtering**: Per-column filters (text, dropdown, date, integer).
- **Global search**: Search across all visible columns.
- **Sorting**: Click column headers to sort ascending/descending.
- **Column chooser**: Show/hide columns dynamically.
- **Sticky columns**: Pin columns to the left.
- **Fullscreen mode**: Expand table to fullscreen.
- **Pagination**: Paginate data with configurable page size.
- **Theming**: Light, dark, and custom color themes via CSS variables.

## Usage

```tsx
import Table, { TableColumn } from './Table';

// Define your columns
const columns: TableColumn<MyRowType>[] = [
  { key: 'name', header: 'Name', filterable: true },
  { key: 'age', header: 'Age', type: 'integer', filterable: true },
  { key: 'role', header: 'Role', filterType: 'dropdown', filterOptions: ['Admin', 'User'] },
  { key: 'createdAt', header: 'Created', type: 'date', filterable: true },
  // ...more columns
];

// Your data
const data = [
  { name: 'Alice', age: 30, role: 'Admin', createdAt: '2023-01-01' },
  // ...
];

// Render the table
<Table
  columns={columns}
  data={data}
  striped
  hoverable
  enableColumnChooser
  enableSearch
  enableFilters
  enableFullscreen
  enablePagination
  pageSize={10}
  defaultHiddenColumns={['createdAt']}
  stickyColumnCount={1}
/>
```

## Props

| Prop                  | Type                       | Description                                                      |
|-----------------------|----------------------------|------------------------------------------------------------------|
| `columns`             | `TableColumn<T>[]`         | Column definitions (see below)                                   |
| `data`                | `T[]`                      | Table data                                                       |
| `striped`             | `boolean`                  | Alternate row background                                         |
| `hoverable`           | `boolean`                  | Highlight row on hover                                           |
| `enableColumnChooser` | `boolean`                  | Show column chooser dropdown                                     |
| `enableSearch`        | `boolean`                  | Show global search input                                         |
| `enableFilters`       | `boolean`                  | Show per-column filters                                          |
| `enableFullscreen`    | `boolean`                  | Enable fullscreen toggle                                         |
| `enablePagination`    | `boolean`                  | Enable pagination controls                                       |
| `pageSize`            | `number`                   | Rows per page (default: 10)                                      |
| `defaultHiddenColumns`| `(keyof T)[]`              | Columns to hide by default                                       |
| `stickyColumnCount`   | `number`                   | Number of columns to pin to the left                             |

### TableColumn Options

| Option         | Type                        | Description                                  |
|----------------|-----------------------------|----------------------------------------------|
| `key`          | `keyof T`                   | Field name                                   |
| `header`       | `string`                    | Column header label                          |
| `render`       | `(value, row) => ReactNode` | Custom cell renderer                         |
| `width`        | `string`                    | Column width (e.g. `'120px'`, `'20%'`)       |
| `wrap`         | `'normal' \| 'nowrap' \| 'break-word'` | Cell text wrapping style           |
| `filterable`   | `boolean`                   | Enable filter for this column                |
| `type`         | `'string' \| 'date' \| 'integer' \| 'html'` | Data type for filter/sort         |
| `renderHTML`   | `boolean`                   | Render cell as HTML (dangerouslySetInnerHTML)|
| `sticky`       | `boolean`                   | Make column sticky (left-pinned)             |
| `filterType`   | `'search' \| 'dropdown' \| 'date' \| 'integer'` | Filter UI type                  |
| `filterOptions`| `string[]`                  | Dropdown filter options                      |

## Theming

The table supports light, dark, and custom themes using CSS variables.  
Set the theme by adding `data-theme="dark"` or `data-theme="blue"` to a parent element.

```html
<div data-theme="dark">
  <Table ... />
</div>
```

## Notes

- Use the column chooser to show/hide columns at runtime.
- Use sticky columns for improved horizontal scrolling.
- Filtering and search work only on visible columns.
- For HTML cell rendering, set `type: 'html'` or `renderHTML: true` on the column.

---