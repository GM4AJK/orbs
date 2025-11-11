
import { AppMain } from './appmain.js';

const app = new AppMain();

function animate() {
  requestAnimationFrame(animate);
  app.main();
}

animate();
