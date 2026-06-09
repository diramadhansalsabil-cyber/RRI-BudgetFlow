export default function Table({ columns, data, emptyMessage = 'Tidak ada data', onRowClick }) {
  if (!data?.length) {
    return <div className="table-empty">{emptyMessage}</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id || idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'table-row-clickable' : ''}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row, idx) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
