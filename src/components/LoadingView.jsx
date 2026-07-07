export default function LoadingView({ message = '데이터를 불러오는 중입니다.' }) {
  return <div className="state-view">{message}</div>;
}
