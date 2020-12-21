import 'babel-polyfill'
import Ipfs from 'ipfs'
import OrbitDB from 'orbit-db'

class NewPiecePlease {
    constructor(Ipfs, OrbitDB = undefined) {
        this.Ipfs = Ipfs
        this.OrbitDB = OrbitDB
    }
}

try {
    console.log('newPiecePlease')

    module.exports = exports = new NewPiecePlease(Ipfs, OrbitDB)
} catch (e) {
    window.NPP = new NewPiecePlease(Ipfs, OrbitDB)
}