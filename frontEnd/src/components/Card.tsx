function Card({children}) {
	return (
		<div className="flex flex-col justify-between items-center bg-surface-elevated/50 p-6 rounded-panel border border-border-subtle">
			{children}
		</div>
  	)
}

export default Card