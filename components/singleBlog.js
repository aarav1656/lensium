import { useEffect, useState } from 'react'


export default function SingleBlog() {
    const [postData, setPostData] = useState('')
    let blogs2;
    async function getBlogs() {
        const chunks = [];
        const blogs = await fetch("https://ipfs.filebase.io/ipfs/QmdQ9fJkNMSbZzWzbamyG4DtkBeGX4cN4fXN2B7JFPrGTD");
        blogs2 = await blogs.json()
        console.log(blogs2.content);
        setPostData(blogs2.content)
    }
    getBlogs()

    return (



        <div id="blog" class="bg-gray-100 dark:bg-gray-900 px-4 xl:px-4 py-14">
            <div class="mx-auto container">
                <span role="contentinfo">
                    <h1 tabindex="0" class="focus:outline-none text-center text-3xl lg:text-5xl tracking-wider text-gray-900 dark:text-white">Latest from Lensium</h1>
                </span>
                <div tabindex="0" aria-label="Group of cards" class="focus:outline-none mt-12 lg:mt-24">
                    <div class="grid sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8">
                        <div tabindex="0" class="focus:outline-none" aria-label="card 1">
                            <img role="img" aria-label="code editor" tabindex="0" class="focus:outline-none w-full" src="https://cdn.tuk.dev/assets/components/111220/Blg-6/blog(1).png" alt="code editor" />
                            <div class="py-4 px-8 w-full flex justify-between bg-indigo-700">
                                <p tabindex="0" class="focus:outline-none text-sm text-white font-semibold tracking-wide">Bruce Wayne{postData}</p>
                                <p tabindex="0" class="focus:outline-none text-sm text-white font-semibold tracking-wide">13TH Oct, 2020</p>
                            </div>
                            <div class="bg-white dark:bg-gray-800 px-10 py-6 rounded-bl-3xl rounded-br-3xl">
                                <h1 tabindex="0" class="focus:outline-none text-4xl text-gray-900 dark:text-white font-semibold tracking-wider">Transactions</h1>
                                <p tabindex="0" class="focus:outline-none text-gray-700 dark:text-gray-200 text-base lg:text-lg lg:leading-8 tracking-wide mt-6 w-11/12">Find the latest events updates or create events, concerts, conferences, workshops, exhibitions, and cultural events in all cities of the US. The aim of Eventistan is to promote healthy and entertaining event.Find the latest events updates or create events, concerts, conferences, workshops, exhibitions, and cultural events in all cities of the US. The aim of Eventistan is to promote healthy and entertaining event.</p>
                                <div class="w-full flex justify-end" >
                                    <button class="focus:outline-none focus:ring-2 ring-offset-2 focus:ring-gray-600 hover:opacity-75 mt-4 justify-end flex items-center cursor-pointer">
                                        <span class=" text-base tracking-wide text-indigo-700">Read more</span>
                                        <img class="ml-3 lg:ml-6" src="https://tuk-cdn.s3.amazonaws.com/can-uploader/2-column-with-main-and-supporting-svg1.svg" alt="arrow" />
                                    </button>
                                </div>
                                <div class="h-5 w-2"></div>
                            </div>
                        </div>
                        <div>

                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}
