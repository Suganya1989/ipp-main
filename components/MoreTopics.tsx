
const MoreTopics = () => {
    return (
        <div className='flex flex-col gap-4 items-center justify-center w-full'>
            <div className='w-11/12 md:w-10/12'>
                <h3 className='font-semibold text-lg text-brand-primary-900'>More Topics</h3>
            </div>
            <div className='flex flex-col md:flex-row gap-3 md:gap-0 items-center justify-between w-11/12 md:w-10/12'>
                <div className='p-3 border border-muted rounded-lg w-full md:w-56 transition-all cursor-pointer hover:bg-brand-primary-900 group bg-brand-secondary-100/50'>
                    <h3 className='font-medium text-base md:text-lg text-brand-primary-900 group-hover:text-white'>Prison Stories</h3>
                    <p className='text-sm group-hover:text-muted text-muted-foreground'>123 Blogs</p>
                </div>
                <div className='p-3 border border-muted rounded-lg w-full md:w-56 transition-all cursor-pointer hover:bg-brand-primary-900 group bg-brand-secondary-100/50'>
                    <h3 className='font-medium text-base md:text-lg text-brand-primary-900 group-hover:text-white'>Case Laws</h3>
                    <p className='text-sm group-hover:text-muted text-muted-foreground'>56 Blogs</p>
                </div>
                <div className='p-3 border border-muted rounded-lg w-full md:w-56 transition-all cursor-pointer hover:bg-brand-primary-900 group bg-brand-secondary-100/50'>
                    <h3 className='font-medium text-base md:text-lg text-brand-primary-900 group-hover:text-white'>Jurisprudence</h3>
                    <p className='text-sm group-hover:text-muted text-muted-foreground'>43 Blogs</p>
                </div>
                <div className='p-3 border border-muted rounded-lg w-full md:w-56 transition-all cursor-pointer hover:bg-brand-primary-900 group bg-brand-secondary-100/50'>
                    <h3 className='font-medium text-base md:text-lg text-brand-primary-900 group-hover:text-white'>Penal Philosophy</h3>
                    <p className='text-sm group-hover:text-muted text-muted-foreground'>29 Blogs</p>
                </div>
                <div className='p-3 border border-muted rounded-lg w-full md:w-56 transition-all cursor-pointer hover:bg-brand-primary-900 group bg-brand-secondary-100/50'>
                    <h3 className='font-medium text-base md:text-lg text-brand-primary-900 group-hover:text-white'>Miscellaneous</h3>
                    <p className='text-sm group-hover:text-muted text-muted-foreground'>8 Blogs</p>
                </div>
            </div>
        </div>
    )
}

export default MoreTopics