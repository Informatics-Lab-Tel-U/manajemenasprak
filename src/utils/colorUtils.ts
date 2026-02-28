export const getCourseColor = (name: string) => {
  const colors = [
    '#dc3c3c', // red
    '#e05a1f', // orange
    '#c99a00', // yellow
    '#18a558', // green
    '#1098ad', // cyan
    '#3a5edb', // blue
    '#4b4fd6', // indigo
    '#8b3fd6', // purple
    '#d63384', // pink
    '#d7264f', // rose
    '#059669', // emerald
    '#0284c7', // sky
    '#4f46e5', // indigo-vivid
    '#7c3aed', // violet
    '#c026d3', // fuchsia
    '#db2777', // pink-vivid
    '#ea580c', // orange-vivid
    '#65a30d', // lime
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
