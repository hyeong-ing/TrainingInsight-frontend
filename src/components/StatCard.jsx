export default function StatCard({ label, value, helper, tone = 'default' }) {
  const className = tone === 'attention' ? 'stat-card stat-card--attention' : 'stat-card';

  return (
    <section className={className} aria-label={`${label}: ${value}`}>
      <h2 className="stat-card__label">{label}</h2>
      <strong className="stat-card__value">{value}</strong>
      {helper ? <p className="stat-card__helper">{helper}</p> : null}
    </section>
  );
}
