console.log('sup guys!')
import NPP from './lib/newPiecePlease'

const main = async () => {
    const nPP = await new NPP();
    console.log(nPP.orbitdb.id)
    console.log(nPP.pieces.id)
};
main();
