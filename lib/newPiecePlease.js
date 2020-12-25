import 'babel-polyfill'
import Ipfs from 'ipfs'
import OrbitDB from 'orbit-db'

class NewPiecePlease {
    constructor(IPFS = Ipfs, ODB = OrbitDB) {
        this.IPFS = IPFS
        this.OrbitDB = OrbitDB

        return this._init()
    }

    async _init() {
        this.node = await this.IPFS.create({
            // preload: { enabled: false },
            // repo: './ipfs',
            EXPERIMENTAL: { pubsub: true },
            relay: { enabled: true, hop: { enabled: true, active: true } },
            config: {
                Addresses: {
                    Swarm: [
                        // Libp2p hosted signal server https://github.com/libp2p/js-libp2p-webrtc-star#hosted-rendezvous-server
                        "/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/",
                        "/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/",

                        // IPFS dev webrtc signal server
                        "/dns4/webrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star/",

                        // experimental webrtc
                        "/ip4/198.46.197.197/tcp/4001/ipfs/QmdXiwDtfKsfnZ6RwEcovoWsdpyEybmmRpVDXmpm5cpk2s",

                        // locally hosted websocket star
                        // "/ip4/0.0.0.0/tcp/9090/wss/p2p-webrtc-star",
                        // local brave browser hosted star
                        // "/ip4/127.0.0.1:5001/", 

                        // config default
                        // "/ip4/0.0.0.0/tcp/4002",
                        // another config default, however creating ws server in browser is not allowed
                        // "/ip4/127.0.0.1/tcp/4003/ws",
                    ]
                }
            }
        })

        const peerInfo = await this.node.id()

        this.orbitdb = await this.OrbitDB.createInstance(this.node)

        this.defaultOptions = { accessController: { write: [this.orbitdb.identity.id] } }

        const docStoreOptions = {
            ...this.defaultOptions,
            indexBy: 'hash',
        }

        this.user = await this.orbitdb.kvstore('user', this.defaultOptions)
        this.companions = await this.orbitdb.keyvalue('companions', this.defaultOptions)
        this.pieces = await this.orbitdb.docstore('pieces', docStoreOptions)

        await this.user.load()
        await this.companions.load()
        await this.loadFixtureData({
            'username': Math.floor(Math.random() * 1000000),
            'pieces': this.pieces.id,
            'nodeId': peerInfo.id
        })

        this.node.libp2p.on('peer:connect', this.handlePeerConnected)
        await this.node.pubsub.subscribe(peerInfo.id, this.handleMessageReceived)

        console.log('this.companions',this.companions)

        this.companionConnectionInterval = setInterval(this.connectToCompanions.bind(this), 10000)
        this.connectToCompanions()

        await this.user.set('pieces', this.pieces.id)

        return this
    }

    async loadFixtureData(fixtureData) {
        const fixtureKeys = Object.keys(fixtureData)
        for (let i in fixtureKeys) {
            let key = fixtureKeys[i]
            if (!this.user.get(key)) await this.user.set(key, fixtureData[key])
        }
    }

    async getIpfsPeers() {
        const peers = await this.node.swarm.peers()
        return peers
    }

    handlePeerConnected(ipfsPeer) {
        const ipfsId = ipfsPeer.id.toB58String()

        setTimeout(async () => {
            await this.sendMessage(ipfsId, { userDb: this.user.id })
        }, 2000)

        if (this.onpeerconnect) this.onpeerconnect(ipfsId)
    }

    async connectToPeer(multiaddr, protocol = '/p2p-circuit/ipfs/') {
        try {
            await this.node.swarm.connect(protocol + multiaddr)
        } catch (e) {
            throw (e)
        }
    }

    async handleMessageReceived(msg) {
        const parsedMsg = JSON.parse(msg.data.toString())
        const msgKeys = Object.keys(parsedMsg)

        switch (msgKeys[0]) {
            case 'userDb':
                var peerDb = await this.orbitdb.open(parsedMsg.userDb)
                peerDb.events.on('replicated', async () => {
                    if (peerDb.get('pieces')) {
                        await this.companions.set(peerDb.id, peerDb.all)
                        this.ondbdiscovered && this.ondbdiscovered(peerDb)
                    }
                })
                break
            default:
                break
        }

        if (this.onmessage) this.onmessage(msg)
    }

    async sendMessage(topic, message) {
        try {
            const msgString = JSON.stringify(message)
            // const messageBuffer = this.IPFS.Buffer(msgString)
            await this.node.pubsub.publish(topic, msgString)
        } catch (e) {
            throw (e)
        }
    }

    async connectToCompanions() {
        const companionIds = Object.values(this.companions.all).map(companion => companion.nodeId)
        const connectedPeerIds = await this.getIpfsPeers()

        await Promise.all(companionIds.map(async (companionId) => {
            if (connectedPeerIds.indexOf(companionId) !== -1) return
            try {
                //  call this.connectToPeer(companionId) in parallel for all registered companions in your database.
                await this.connectToPeer(companionId)
                // If they are found oncompaniononline will fire.
                this.oncompaniononline && this.oncompaniononline()
            } catch (e) {
                // If not, oncompanionnotfound will fire next.
                this.oncompanionnotfound && this.oncompanionnotfound()
            }
        }))
    }

    getCompanions() {
        return this.companions.all
    }

    getAllProfileFields() {
        return this.user.all;
    }

    getProfileField(key) {
        return this.user.get(key)
    }

    async updateProfileField(key, value) {
        const cid = await this.user.set(key, value)
        return cid
    }

    async deleteProfileField(key) {
        const cid = await this.user.del(key)
        return cid
    }

    async addNewPiece(hash, instrument = 'Piano') {
        const existingPiece = this.getPieceByHash(hash)
        if (existingPiece) {
            console.warn("existingPiece", existingPiece)
            const updatedPiece = await this.updatePieceByHash(hash, instrument)
            return updatedPiece
        }

        const dbName = 'counter.' + hash.substr(20, 20)
        const counter = await this.orbitdb.counter(dbName, this.defaultOptions)
        await this.pieces.put({
            hash,
            instrument,
            counter: counter.id
        })
        return hash
    }

    getAllPieces() {
        const pieces = this.pieces.get('')
        return pieces
    }

    getPieceByHash(hash) {
        // console.log('getPiece',this.pieces.get(hash))
        const singlePiece = this.pieces.get(hash)[0]
        return singlePiece
    }

    getPieceByInstrument(instrument) {
        return this.pieces.query((piece) => piece.instrument === instrument)
    }

    async updatePieceByHash(hash, instrument = 'Piano') {
        const piece = await this.getPieceByHash(hash)
        piece.instrument = instrument
        const cid = await this.pieces.put(piece)
        return cid
    }

    async deletePieceByHash(hash) {
        const cid = await this.pieces.del(hash)
        return cid
    }

    async getPracticeCount(piece) {
        // opens the existing database instead of creating it
        const counter = await this.orbitdb.counter(piece.counter)
        await counter.load()
        return counter.value
    }

    async incrementPracticeCounter(piece) {
        // opens the existing database instead of creating it
        const counter = await this.orbitdb.counter(piece.counter)
        const cid = await counter.inc()
        return cid
    }
}

module.exports = NewPiecePlease