import axios from 'axios';
import create from 'zustand'
import { provider, signer } from '../initializers/ethers';
import { SiweMessage } from 'siwe'

type TAuthStore = {
    address: string
    ready: boolean
    loggedIn: boolean
    connectWallet(): void
    signin(): void
    init(): void
}

export const authStore = create<TAuthStore>((set) => ({
    address: '',
    loggedIn: false,
    ready: false,

    init: async() => {
        try {
            const res = await axios.get('/api/validate')
                set({ address: res.data.address, loggedIn: true, ready: true })
            } catch (err) {
                const accounts = await provider.listAccounts()

            if (accounts[0]) {
                set({ ready: true, address: accounts[0] })
            } else {
                set({ ready: true })
            }
        }
    },

    connectWallet: async() => {
        const accounts = await provider
            .send('eth_requestAccounts', [])
            .catch(() => console.log('user rejected request'));
        if (accounts[0]) {
            set({address: accounts[0]})
        }
        // console.log(accounts);
    },
    signin: async() => {
        try {
            //Get Nonce
            const res = await axios.get('/api/nonce')
            console.log(res.data);
            
            //create message
            const messageRaw = new SiweMessage({
                domain: window.location.host,
                address: await signer.getAddress(),
                statement: 'Sign in with Ethereum to the app.',
                uri: window.location.origin,
                version: '1',
                chainId: 1,
                nonce: res.data,
            })
    
            const message = messageRaw.prepareMessage()
    
            //get signature
            const signature = await signer.signMessage(message)
    
            //Send too server
            const res2 = await axios.post('/api/verify', {message, signature})
            // console.log(res2);
            
            set({loggedIn: true})
        } catch(err) {

        }
    },
}))

export default authStore