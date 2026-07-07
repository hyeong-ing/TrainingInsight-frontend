export default function EmptyView({ message = '표시할 데이터가 없습니다.' }) {
  return <div className="state-view">{message}</div>;
}
