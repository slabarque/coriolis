const { defineConfig } = require('vite')
const path = require('path')

export default {
    root: path.resolve(__dirname, 'src'),
    resolve: {
        alias: {
            '~bootstrap': path.resolve(__dirname, 'node_modules/bootstrap'),
        }
    },
    build: {
        outDir: "../dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: './src/index.html',
                coriolis2D: './src/coriolis2D.html',
                coriolis3D: './src/coriolis3D.html'
            }
        }
    },
    server: {
        port: 5173,
        hot: true
    }
}

// module.exports = defineConfig({
//     build: {
//         rollupOptions: {
//             input: {
//                 main: './src/index.html',
//                 coriolis2D: './src/coriolis2D.html'
//             }
//         }
//     }
// })