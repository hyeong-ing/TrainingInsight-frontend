export default function ErrorView({ message = '요청을 처리하지 못했습니다.' }) {
  return <div className="state-view state-view--error">{message}</div>;
}
