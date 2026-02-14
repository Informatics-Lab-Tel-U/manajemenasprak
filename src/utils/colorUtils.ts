export const getCourseColor = (name: string) => {
  const colors = [
    '#dc3c3c', // red balanced
    '#e05a1f', // orange balanced
    '#c99a00', // yellow balanced
    '#18a558', // green balanced
    '#1098ad', // cyan balanced
    '#3a5edb', // blue balanced
    '#4b4fd6', // indigo balanced
    '#8b3fd6', // purple balanced
    '#d63384', // pink balanced
    '#d7264f', // rose balanced
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};
