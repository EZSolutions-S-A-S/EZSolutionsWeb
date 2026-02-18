document.addEventListener("DOMContentLoaded", () => {

  const marquees = document.querySelectorAll(".marquee");

  marquees.forEach((marquee, index) => {

    let position = 0;
    const speed = index === 0 ? 0.5 : -0.5;

    marquee.innerHTML += marquee.innerHTML;

    const contentWidth = marquee.scrollWidth / 2;

    function animate() {
      position += speed;

      if (speed < 0 && Math.abs(position) >= contentWidth) {
        position = 0;
      }

      if (speed > 0 && position >= contentWidth) {
        position = 0;
      }

      marquee.style.transform = `translateX(${position}px)`;

      requestAnimationFrame(animate);
    }

    animate();
  });

});
