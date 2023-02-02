import { connect, Contract, keyStores, WalletConnection } from 'near-api-js'
import getConfig from './config'

const nearConfig = getConfig(/*process.env.NODE_ENV || */'development')

export async function initContract() {
  const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nearConfig))
  window.walletConnection = new WalletConnection(near)
  window.accountId = window.walletConnection.getAccountId()
  window.contract = await new Contract(window.walletConnection.account(), nearConfig.contractName, {
    viewMethods: ['get_board'],
    changeMethods: ['create_board', 'step'],
  })
}

export function logout() {
  window.walletConnection.signOut()
  window.location.replace(window.location.origin + window.location.pathname)
}

export function login() {
  window.walletConnection.requestSignIn(nearConfig.contractName)
}

export async function create_board(field){
  let index = await window.contract.set_greeting({
    args:{field: field}
  })
  return index
}

export async function get_board(index){
  let board = await window.contract.get_board({index: index});
  console.log(index, board);
  if (board == null) {
    return null;
  }
  return board;
}

export async function step(index){
  let board = await window.contract.step({index: index});
  return board
}