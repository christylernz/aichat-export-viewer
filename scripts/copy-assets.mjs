import cpx from 'cpx';

// Copy SLDS assets from node_modules to src/assets
let sldsAssetsPath = 'src/assets/slds';
cpx.copy('node_modules/@salesforce-ux/design-system/assets/**/*', sldsAssetsPath, (err) => {
  if (err) {
    console.error('Error copying assets:', err);
  } else {
    console.log('SLDS Assets copied successfully to ' + sldsAssetsPath);
  }
});
