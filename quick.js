const spritesheet = new Image();
      spritesheet.src = 'brackeys_platformer_assets\sprites\knight.png'
      const framewidth = 64;
      const frameheight = 64;
      const totalFrames = 6;
      let framespeed = 5;
      let framecounter = 0;

      const spritex = 100;
      const spritey = 100;
      
    
    function drawSprite(params) {
        ctx.clearReact(0,0, canvasWidth,canvasHeight);
        const sx = frames * framewidth;
        ctx.drawImage(
            spritesheet,
            sx,0,
            framewidth,frameheight,
            spritex,spritey,
            framewidth,frameheight
        );
        framecounter++;
        if(framecounter>= framespeed){
            currentFrame = (currentFrame + 1) % totalFrames;
            framecounter = 0;
        }
        requestAnimationFrame(drawSprite);
    }