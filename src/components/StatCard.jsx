export default function StatCard({ label, value, helper }) {
  return (
    <section className="stat-card">
      <p className="stat-card__label">{label}</p>
      <strong className="stat-card__value">{value}</strong>
      {helper ? <p className="stat-card__helper">{helper}</p> : null}
    </section>
  );
}
