interface PaginationProps {
    postsPerPage: number;
    totalPosts: number;
    paginate: (pageNumber: number) => void;
    currentPage: number;
}

const Pagination = ({postsPerPage, totalPosts, paginate, currentPage}: PaginationProps) => {
    const pageNumbers = [];
    for (let i = 1 ; i <= Math.ceil(totalPosts / postsPerPage); i++) {
        pageNumbers.push(i);
    }

    if (pageNumbers.length <= 1) return null;

  return (
    <nav>
        <ul className='pagination flex items-center justify-center gap-2 mt-4 pb-4'>
            {pageNumbers.map(number => (
                <li key={number}>
                    <button
                        onClick={() => paginate(number)}
                        className={`font-bold text-sm tracking-wide rounded-card px-3 py-1 transition-colors duration-300 w-fit ${
                            number === currentPage
                                ? 'bg-brand-primary text-surface-background border border-brand-primary'
                                : 'text-text-primary border border-border-default bg-surface-background/20 hover:bg-surface-background/30'
                        }`}
                    >
                        {number}
                    </button>
                </li>
            ))}
        </ul>
    </nav>
  )
}

export default Pagination
