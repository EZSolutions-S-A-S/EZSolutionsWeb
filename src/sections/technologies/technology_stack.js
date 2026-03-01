document.addEventListener("DOMContentLoaded", () => {
  const marquees = document.querySelectorAll(".marquee");

  marquees.forEach((marquee, index) => {
    const groups = marquee.querySelectorAll(".marquee__group");
    if (groups.length < 2) return;
    const groupWidth = groups[0].offsetWidth;
    const isLeftMarquee = index === 0;
    const speed = 0.5;

    let position = 0;

    function animate() {
      position += speed;
      if (position >= groupWidth) {
        position = 0;
      }
      let offset = isLeftMarquee ? -position : -groupWidth + position;
      groups.forEach(group => {
        group.style.transform = `translateX(${offset}px)`;
      });

      requestAnimationFrame(animate);
    }

    animate();
  });
});
