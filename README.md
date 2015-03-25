physthing
=========

![Project status: active](https://img.shields.io/badge/project status-active-green.svg)

A little physics-based space game in Javascript and WebGL.

[Demo](https://jkiv.github.io/physthing/)

### Dependencies

* [three.js](https://threejs.org)
* [lo-dash](https://lodash.com/)
* [jquery](http://jquery.com/)
* [seedrandom.js](http://davidbau.com/encode/seedrandom.js)

### TODO

* Normal forces / Friction (e.g. to reduce surface speeds)
* Collision events/conditions (e.g. damage, death)
* Center of mass / Moments of Inertia
* Model zoom-detail mapping (e.g. close-up on planet is super-smooth, but not needed at solar system level)
* System creation/generation (seeded)
  *  stability conditions?
  *  build units? e.g. planet w/ moons; sun w/ planets; etc.
* Terminal velocity / angular velocity
* Goals / End-game scenarios / Score / Gamify
* HUD (fuel; dir, vel, and acc vectors)
* Path tracing (past / future)
* Persistent ship visibility (HUD?)
* Way-points
* Ship
  * energy
  * fuel
  * parts/components (e.g. angular velocity stabilizer)
* Brown noise generator
