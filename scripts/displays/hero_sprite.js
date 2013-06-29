/*
The tsprite component is a simple extension to sprite that defaults the size attributes.
*/
re.c('hero_sprite')
.requires('sprite')
.init(function(){
  this.sizeX = 2 * re.tile.sizeX;
  this.sizeY = 2 * re.tile.sizeY;
  
  this.bodyX = 2 * re.tile.sizeX;
  this.bodyY = 2 *re.tile.sizeY;
  
  //setup registration point
  this.regX = this.sizeX * 0.5;
  this.regY = this.sizeY * 0.5;
  
});
