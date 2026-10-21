-- parodius_da_demake_cartridge.lua
-- retro shooter prototype inspired by fan demake gameplay

p={x=18,y=64,w=8,h=8,hp=5,weapon=0,shield=0}
bullets={}
enemies={}
particles={}
pickups={}
score=0
wave=1
combo=1
state="menu"

function reset_wave()
  enemies={}
  for i=1,4+wave do
    add(enemies,{x=260+flr(rnd(40)),y=12+rnd(100),w=8,h=8,hp=1,type="scout",dx=-1.1-wave*0.04,dy=0})
  end
  if wave%3==0 then
    add(enemies,{x=260,y=50,w=16,h=16,hp=18+wave,type="boss",dx=-0.7,dy=0.5})
  end
end

function start_game()
  p={x=18,y=64,w=8,h=8,hp=5,weapon=0,shield=0}
  bullets={}
  enemies={}
  particles={}
  pickups={}
  score=0
  wave=1
  combo=1
  state="game"
  reset_wave()
end

function spawn_bullet(enemy)
  add(bullets,{x=enemy.x,y=enemy.y+3,dx=-2.6,dy=0,enemy=true})
end

function shoot()
  if state!="game" then return end
  add(bullets,{x=p.x+8,y=p.y+3,dx=2.4,dy=0,enemy=false})
  if p.weapon>0 then add(bullets,{x=p.x+8,y=p.y+3,dx=2.4,dy=-0.45,enemy=false}) end
  if p.weapon>1 then add(bullets,{x=p.x+8,y=p.y+3,dx=2.4,dy=0.45,enemy=false}) end
end

function _update()
  if state=="menu" then
    if btnp(4) then start_game() end
    return
  end

  if state=="gameover" then
    if btnp(4) then start_game() end
    return
  end

  if btn(0) then p.x-=1.2 end
  if btn(1) then p.x+=1.2 end
  if btn(2) then p.y-=1.2 end
  if btn(3) then p.y+=1.2 end
  p.x=mid(4,p.x,240)
  p.y=mid(8,p.y,116)

  if btnp(5) then shoot() end

  for b in all(bullets) do
    b.x+=b.dx*2
    b.y+=b.dy*2
    if b.x>260 or b.x<-10 then del(bullets,b) end
  end

  for e in all(enemies) do
    e.x+=e.dx
    e.y+=sin(t()/2+e.x)*0.7+e.dy
    if rnd() < 0.015 then spawn_bullet(e) end

    for b in all(bullets) do
      if not b.enemy and b.x>e.x and b.x<e.x+e.w and b.y>e.y and b.y<e.y+e.h then
        e.hp-=1
        del(bullets,b)
        if e.hp<=0 then
          score+=100*combo
          combo=min(9,combo+1)
          add(particles,{x=e.x,y=e.y,life=16})
          del(enemies,e)
        end
        break
      end
    end

    if e.x < -10 then
      del(enemies,e)
      p.hp-=1
      if p.hp <= 0 then state="gameover" end
    end
  end

  for b in all(bullets) do
    if b.enemy and abs(b.x-p.x)<8 and abs(b.y-p.y)<8 then
      del(bullets,b)
      p.hp-=1
      if p.hp<=0 then state="gameover" end
    end
  end

  if #enemies==0 then
    wave+=1
    combo=1
    reset_wave()
  end
end

function _draw()
  cls(1)
  if state=="menu" then
    print('press x to start', 60, 58, 7)
    return
  end

  if state=="gameover" then
    print('game over', 82, 58, 8)
    print('score '..score, 76, 68, 7)
    print('press x to retry', 60, 78, 7)
    return
  end

  rectfill(0,0,255,127,1)

  for x=0,255,16 do
    rectfill(x,0,x+1,127,13)
  end

  rectfill(p.x,p.y,p.x+p.w,p.y+p.h,7)

  for b in all(bullets) do
    if b.enemy then pset(b.x,b.y,8) else pset(b.x,b.y,7) end
  end

  for e in all(enemies) do
    rectfill(e.x,e.y,e.x+e.w,e.y+e.h,e.type=="boss" and 8 or 9)
  end

  for p2 in all(particles) do
    pset(p2.x,p2.y,7)
    p2.life-=1
    if p2.life<=0 then del(particles,p2) end
  end

  print('score '..score, 2, 2, 7)
  print('wave '..wave, 2, 10, 7)
  print('hp '..p.hp, 2, 18, 7)
end

start_game()
