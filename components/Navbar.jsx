import Link from 'next/link';
import Home from '../pages';

import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import {
  client, challenge, authenticate, getDefaultProfile,
  signCreatePostTypedData, lensHub, splitSignature, validateMetadata
} from '../api'
import { create } from 'ipfs-http-client'
import { v4 as uuid } from 'uuid'
import { useNetwork } from 'wagmi'
import detectEthereumProvider from "@metamask/detect-provider";





const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
const projectSecret = process.env.NEXT_PUBLIC_PROJECT_SECRET
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const ipfsClient = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
})
export default function Navbar() {
  const [active, setActive] = useState(false);

  const handleClick = () => {
    setActive(!active);
  };
  const [address, setAddress] = useState()
  const [session, setSession] = useState(null)
  const [postData, setPostData] = useState('')
  const [profileId, setProfileId] = useState('')
  const [handle, setHandle] = useState('')
  const [token, setToken] = useState('')
  const [chainId, setchainId] = useState(0)
  useEffect(() => {
    checkConnection()
  }, [])
  useEffect(() => {
    findId()
  }, [])
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
    }
  });
  async function checkConnection() {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const accounts = await provider.listAccounts()
    if (accounts.length) {
      setAddress(accounts[0])
      const response = await client.query({
        query: getDefaultProfile,
        variables: { address: accounts[0] }
      })
      setProfileId(response.data.defaultProfile.id)
      setHandle(response.data.defaultProfile.handle)
    }
  }

  async function findId() {
    const provider = await detectEthereumProvider();
    if (provider) {
      const chainId = await provider.request({ method: "eth_chainId" });
      console.log(chainId);
      setchainId(chainId);
    } else {
      console.log("No provider found...");
    }
  }
  findId()

  const switchNetworkStack = async () => {
    if (window.ethereum) {
      try {
        // Try to switch to the Mumbai testnet
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${Number(137).toString(16)}` }], // Check networks.js for hexadecimal network ids
        });
      } catch (error) {
        // This error code means that the chain we want has not been added to MetaMask
        // In this case we ask the user to add it to their MetaMask
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {   
                  chainId: '0x137',
                  chainName: 'Polygon Mainnet',
                  rpcUrls: ['https://polygon-rpc.com/'],
                  nativeCurrency: {
                      name: " Matic",
                      symbol: "MATIC",
                      decimals: 18
                  },
                  blockExplorerUrls: ["https://polygonscan.com/"]
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      // If window.ethereum is not found then MetaMask is not installed
      alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
    } 
      }


  async function connect() {
    const account = await window.ethereum.send('eth_requestAccounts')
    if (account.result.length) {
      setAddress(account.result[0])
      const response = await client.query({
        query: getDefaultProfile,
        variables: { address: accounts[0] }
      })
      setProfileId(response.data.defaultProfile.id)
      setHandle(response.data.defaultProfile.handle)
    }
  }
  async function login() {
    try {
      const challengeInfo = await client.query({
        query: challenge,
        variables: {
          address
        }
      })
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner()
      const signature = await signer.signMessage(challengeInfo.data.challenge.text)
      const authData = await client.mutate({
        mutation: authenticate,
        variables: {
          address, signature
        }
      })

      const { data: { authenticate: { accessToken } } } = authData
      localStorage.setItem('lens-auth-token', accessToken)
      setToken(accessToken)
      setSession(authData.data.authenticate)
    } catch (err) {
      console.log('Error signing in: ', err)
    }
  }
  async function createPost() {
    if (!postData) return
    const ipfsData = await uploadToIPFS()
    const createPostRequest = {
      profileId,
      contentURI: 'ipfs://' + ipfsData.path,
      collectModule: {
        freeCollectModule: { followerOnly: true }
      },
      referenceModule: {
        followerOnlyReferenceModule: false
      },
    }
    try {
      const signedResult = await signCreatePostTypedData(createPostRequest, token)
      const typedData = signedResult.result.typedData
      const { v, r, s } = splitSignature(signedResult.signature)
      const tx = await lensHub.postWithSig({
        profileId: typedData.value.profileId,
        contentURI: typedData.value.contentURI,
        collectModule: typedData.value.collectModule,
        collectModuleInitData: typedData.value.collectModuleInitData,
        referenceModule: typedData.value.referenceModule,
        referenceModuleInitData: typedData.value.referenceModuleInitData,
        sig: {
          v,
          r,
          s,
          deadline: typedData.value.deadline,
        },
      })
      console.log('successfully created post: tx hash', tx.hash)
    } catch (err) {
      console.log('error posting publication: ', err)
    }
  }
  async function uploadToIPFS() {
    const metaData = {
      version: '2.0.0',
      content: postData,
      description: postData,
      name: `Post by @${handle}`,
      external_url: `https://lenster.xyz/u/${handle}`,
      metadata_id: uuid(),
      mainContentFocus: 'TEXT_ONLY',
      attributes: [],
      locale: 'en-US',
    }

    const result = await client.query({
      query: validateMetadata,
      variables: {
        metadatav2: metaData
      }
    })
    console.log('Metadata verification request: ', result)

    const added = await ipfsClient.add(JSON.stringify(metaData))
    return added
  }
  function onChange(e) {
    setPostData(e.target.value)
  }

  return (
    <nav class="bg-white border-gray-200 px-2 sm:px-4 py-2.5 rounded dark:bg-gray-900">
      <div class="container flex flex-wrap items-center justify-between mx-auto">
        <a href="localhost://3000" class="flex items-center">
          <img src="lensium.jpg" class="h-9 mr-5 sm:h-8" alt="Lensium" />
          <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Lensium</span>
        </a>
        <div class="flex md:order-2">
          <button type="button" data-collapse-toggle="navbar-search" aria-controls="navbar-search" aria-expanded="false" class="md:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2.5 mr-1" >
            <svg class="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
            <span class="sr-only">Search</span>
          </button>
          <div class="relative hidden md:block">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg class="w-5 h-5 text-gray-500" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
              <span class="sr-only">Search icon</span>
            </div>
            <input type="text" id="search-navbar" class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search..." />
          </div>
          <button data-collapse-toggle="navbar-search" type="button" class="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-search" aria-expanded="false">
            <span class="sr-only">Open menu</span>
            <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>
          </button>
        </div>
        <div class="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-search">
          <div class="relative mt-3 md:hidden">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg class="w-5 h-5 text-gray-500" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
            </div>
            <input type="text" id="search-navbar" class="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search..." />
          </div>



          <div>
            {
            chainId != 137 && (
              <div onClick={switchNetworkStack}>
                <button type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-8 py-3 mr-7 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">switch </button>

              </div>
            )}


            {!address && (
              <div onClick={connect}>
                <button type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">connect </button>

              </div>
            )}
            {address && !session && (
              <div onClick={login}>
                <button type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">login </button>

              </div>
            )}
            {
              address && session && (
                <div>
                  <textarea class="w-96"
                    onChange={onChange}
                  />

                  <button onClick={createPost} type="button" class="text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700">Post</button>

                </div>

              )
            }
          </div>

          <ul class="flex flex-col p-4 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            <li>
              <a href="#" class="block py-2 pl-3 pr-4 text-white bg-blue-700 rounded md:bg-transparent md:text-blue-700 md:p-0 dark:text-white" aria-current="page">Home</a>
            </li>
            <li>
              <a href="#" class="block py-2 pl-3 pr-4 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 md:dark:hover:text-white dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">About</a>
            </li>
            <li>
              <a href="#" class="block py-2 pl-3 pr-4 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700">Services</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};