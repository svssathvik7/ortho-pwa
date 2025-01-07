// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // This will ignore certain warnings during build
      onwarn(warning, warn) {
        // Ignore specific warning patterns
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        
        // Let other warnings through
        warn(warning)
      }
    }
  },
  esbuild: {
    // Drop console.log and debugger statements in production
    drop: ['console', 'debugger'],
    // Ignore certain lint warnings
    legalComments: 'none',
    // Set this to false if you want to ignore type errors during build
  }
})