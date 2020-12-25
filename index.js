console.log('sup guys!')
import NewPiecePlease from './lib/newPiecePlease'

// QmNR2n4zywCV61MeMLB6JwPueAPqheqpfiA4fLPMxouEmQ | Metroid - Ending Theme.pdf
// QmRn99VSCVdC693F6H4zeS7Dz3UmaiBiSYDf6zCEYrWynq | Metroid - Escape Theme.pdf
// QmdzDacgJ9EQF9Z8G3L1fzFwiEu255Nm5WiCey9ntrDPSL | Metroid - Game Start.pdf
// QmcFUvG75QTMok9jrteJzBUXeoamJsuRseNuDRupDhFwA2 | Metroid - Item Found.pdf
// QmTjszMGLb5gKWAhFZbo8b5LbhCGJkgS8SeeEYq3P54Vih | Metroid - Kraids Hideout.pdf
// QmNfQhx3WvJRLMnKP5SucMRXEPy9YQ3V1q9dDWNC6QYMS3 | Metroid - Norfair.pdf
// QmQS4QNi8DCceGzKjfmbBhLTRExNboQ8opUd988SLEtZpW | Metroid - Ridleys Hideout.pdf
// QmcJPfExkBAZe8AVGfYHR7Wx4EW1Btjd5MXX8EnHCkrq54 | Metroid - Silence.pdf
// Qmb1iNM1cXW6e11srUvS9iBiGX4Aw5dycGGGDPTobYfFBr | Metroid - Title Theme.pdf
// QmYPpj6XVNPPYgwvN4iVaxZLHy982TPkSAxBf2rzGHDach | Metroid - Tourian.pdf
// QmefKrBYeL58qyVAaJoGHXXEgYgsJrxo763gRRqzYHdL6o | Metroid - Zebetite.pdf

const main = async () => {
    const npp = await new NewPiecePlease();
    // console.log(npp.orbitdb.id)
    // console.log(npp.pieces.id)

    console.log('bootstraplist', await npp.node.bootstrap.list())

    const id = await npp.node.id()
    console.log(id.addresses)

    const peers = await npp.getIpfsPeers()
    console.log(peers.length)

    npp.onmessage = console.log
    npp.oncompaniononline = console.log
    npp.oncompanionnotfound = () => { throw(e) }

    let data = {stuff: "hulloes" }// can be any JSON-serializable value
    const hash = "QmXG8yk8UJjMT6qtE2zSxzz3U7z5jSYRgVWLCUFqAVnByM";
    await npp.sendMessage(hash, data)

    const cid = await npp.addNewPiece("QmNR2n4zywCV61MeMLB6JwPueAPqheqpfiA4fLPMxouEmQ", "Piano")
    // const newContent = await npp.node.dag.get(cid)

    // const pieces = npp.getAllPieces()
    // pieces.forEach(piece => console.log('a piece', piece))

    // const pianoPieces = npp.getPieceByInstrument("Piano")
    // const randomPiece = pianoPieces[pianoPieces.length * Math.random() | 0]
    // console.log(randomPiece)

    const updatedCid = await npp.updatePieceByHash("QmNR2n4zywCV61MeMLB6JwPueAPqheqpfiA4fLPMxouEmQ", "Harpsichord")
    // do stuff with the updatedCid as above

    const deletedCid = await npp.deletePieceByHash("QmNR2n4zywCV61MeMLB6JwPueAPqheqpfiA4fLPMxouEmQ")
    const deletedContent = await npp.node.dag.get(deletedCid)
    // console.log(deletedContent.value.payload)

    const countedCid = await npp.addNewPiece('QmRn99VSCVdC693F6H4zeS7Dz3UmaiBiSYDf6zCEYrWynq', 'Xylophone')
    console.log("countedCid", countedCid)
    console.log('getAllPieces', (await npp.getAllPieces()));
    const pieceToCount = await npp.getPieceByHash(countedCid)
    console.log("pieceToCount", pieceToCount)

    await npp.incrementPracticeCounter(pieceToCount)
    const count = await npp.getPracticeCount(pieceToCount)
    console.log("count", count)

    await npp.updateProfileField("username", "aphelionz")

    const profileFields = npp.getAllProfileFields()
    // { "username": "aphelionz", "pieces": "/orbitdb/zdpu...../pieces" }
    console.log("profileFields", profileFields)

    await npp.deleteProfileField("username")
};
main();
