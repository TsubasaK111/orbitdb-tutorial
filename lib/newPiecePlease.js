import 'babel-polyfill'
import Ipfs from 'ipfs'
import OrbitDB from 'orbit-db'

class NewPiecePlease {
    constructor(IPFS = Ipfs, ODB = OrbitDB) {
        this.OrbitDB = OrbitDB;
        this.IPFS = IPFS

        return this._init()
    }

    async _init() {
        this.node = await this.IPFS.create({
            preload: { enabled: false },
            repo: './ipfs',
            EXPERIMENTAL: { pubsub: true },
            config: {
                Bootstrap: [],
                Addresses: { Swarm: [] }
            }
        })

        this.orbitdb = await this.OrbitDB.createInstance(this.node)

        this.defaultOptions = { accessController: { write: [this.orbitdb.identity.id] } }

        const docStoreOptions = {
            ...this.defaultOptions,
            indexBy: 'hash',
        }
        this.pieces = await this.orbitdb.docstore('pieces', docStoreOptions)
        
        return this
    }
}

module.exports = NewPiecePlease