interface ButtonProps {
	label: string;
	variant: 'primary' | 'secondary';
	disabled: boolean;
	onClick?: () => void;
}

export default function Button({ label, variant, disabled, onClick }: ButtonProps) {
	const baseStyles = "px-4 py-2 rounded-interactive font-semibold transition-all duration-300";

	const variantStyles = variant === 'primary' 
	  ? "bg-brand-primary text-surface-panel hover:bg-brand-success cursor-pointer" 
	  : "text-text-secondary hover:text-text-primary";
	const disabledStyles = "disabled:cursor-not-allowed bg-brand-primary/50";
		return (
			<button
				disabled={disabled}
	  			className={`${baseStyles}  ${disabled ? disabledStyles : variantStyles}`}
	  			onClick={onClick}
				>
	  			{label}
	  		</button>
	);
}