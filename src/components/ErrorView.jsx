export default function ErrorView({
  title,
  message = '요청을 처리하지 못했습니다.',
  onRetry,
  isRetrying = false,
  retryLabel = '다시 시도',
}) {
  return (
    <div className="state-view state-view--error">
      <div className="state-view__copy">
        {title ? <strong className="state-view__title">{title}</strong> : null}
        <p>{message}</p>
      </div>
      {onRetry ? (
        <button className="action-button" type="button" disabled={isRetrying} onClick={onRetry}>
          {isRetrying ? '다시 불러오는 중…' : retryLabel}
        </button>
      ) : null}
    </div>
  );
}
