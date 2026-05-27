export default function CustomKeypad({ value, onChange, allowDecimal }) {
  const press = (key) => {
    if (key === 'back') return onChange(value.slice(0, -1));
    if (key === '.' && (!allowDecimal || value.includes('.'))) return;
    if (key !== '.' && value === '0') return onChange(key);
    onChange(`${value}${key}`);
  };
  const keys = ['1','2','3','4','5','6','7','8','9','.','0','back'];
  return (
    <div className="keypad">
      {keys.map((key) => (
        <button key={key} className="keypad-button" disabled={key === '.' && !allowDecimal} onClick={() => press(key)}>
          {key === 'back' ? '←' : key}
        </button>
      ))}
    </div>
  );
}
