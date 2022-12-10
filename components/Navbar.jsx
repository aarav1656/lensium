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
  useEffect(() => {
    checkConnection()
  }, [])
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

      const { data: { authenticate: { accessToken }}} = authData
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
    <>
      <nav className='flex items-center flex-wrap bg-green-400 p-3 '>
        <Link href='/' legacyBehavior><a className='inline-flex items-center p-2 mr-4 '>
            <svg
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
              className='fill-current text-white h-8 w-8 mr-2'
            >
              <path d='M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624 1.177 1.194 2.538 2.576 5.512 2.576 3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z' />
            </svg>
            <span className='text-xl text-white font-bold uppercase tracking-wide'>
              Lensium
            </span>
          </a></Link>
        <button
          className=' inline-flex p-3 hover:bg-green-600 rounded lg:hidden text-white ml-auto hover:text-white outline-none'
          onClick={handleClick}
        >
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 6h16M4 12h16M4 18h16'
            />
          </svg>
        </button>
        {/*Note that in this div we will use a ternary operator to decide whether or not to display the content of the div  */}
        <div
          className={`${
            active ? '' : 'hidden'
          }   w-full lg:inline-flex lg:flex-grow lg:w-auto`}
        >
          <div className='lg:inline-flex lg:flex-row lg:ml-auto lg:w-auto w-full lg:items-center items-start  flex flex-col lg:h-auto'>
            <Link href='/' legacyBehavior><a className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center hover:bg-green-600 hover:text-white '>
                Home
              </a></Link>
            <Link href='/' legacyBehavior><a className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center hover:bg-green-600 hover:text-white'>
                Services
              </a></Link>
            <Link href='/' legacyBehavior><a className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center hover:bg-green-600 hover:text-white'>
                About us
              </a></Link>
            <Link href='/' legacyBehavior><a className='lg:inline-flex lg:w-auto w-full px-3 py-2 rounded text-white font-bold items-center justify-center hover:bg-green-600 hover:text-white'>
            {
        !address && <button onClick={connect}>Connect</button>
      }
      
      {
        address && !token && (
          <div onClick={login}>
            <button>Login</button>
          </div>
        )
      }
      {
        address && token && <h2>Success!</h2>
      }
                
              </a></Link>
              
          </div>
        </div>
      </nav>
    </>
  );
};