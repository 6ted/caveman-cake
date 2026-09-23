import { useRef, useState } from "react";
import "./Home.css";

export default function Home() {
  const [playing, setPlaying] = useState(null);
  const audioRefs = useRef({});

  const handleContinue = () => {
    window.location.href = "/payment";
  };

  const togglePlay = async (id) => {
    const audio = audioRefs.current[id];

    if (!audio) return;

    if (playing === id) {
      audio.pause();
      setPlaying(null);
      return;
    }

    // Stop every other preview
    Object.values(audioRefs.current).forEach((player) => {
      if (player && player !== audio) {
        player.pause();
        player.currentTime = 0;
      }
    });

    try {
      await audio.play();
      setPlaying(id);
    } catch (error) {
      console.error(`Could not play preview: ${id}`, error);
      setPlaying(null);
    }
  };

  const handleEnded = () => {
    setPlaying(null);
  };

  const melodies = [
    {
      id: "Butter-melody-01",
      name: "Butter _ Melody Loop _ BPM 97",
      file: "/previews/Butter _ Melody Loop _ BPM 97.wav",
    },
    {
      id: "Chocolate-melody-02",
      name: "Chocolate _ Melody Loop _ BPM 97",
      file: "/previews/Chocolate _ Melody Loop _ BPM 97.wav",
    },
    {
      id: "Cream-melody-03",
      name: "Cream _ Melody Loop _ BPM 116",
      file: "/previews/Cream _ Melody Loop _ BPM 116.wav",
    },
    {
      id: "Sugar-melody-04",
      name: "Sugar _ Melody Loop _ BPM 98",
      file: "/previews/Sugar _ Melody Loop _ BPM 98.wav",
    },
    {
      id: "Vanilla-melody-05",
      name: "Vanilla _ Melody Loop _ BPM 100",
      file: "/previews/Vanilla _ Melody Loop _ BPM 100.wav",
    },
  ];

  const drums = [
    {
      id: "Butter-drum-01",
      name: "Butter _ DrumLoop _ BPM 97",
      file: "/previews/Butter _ DrumLoop _ BPM 97.wav",
    },
    {
      id: "Chocolate-drum-02",
      name: "Chocolate _  Drum Loop _ BPM 97",
      file: "/previews/Chocolate _  Drum Loop _ BPM 97.wav",
    },
    {
      id: "Cream-drum-03",
      name: "Cream _ Drum Loop _ BPM 116",
      file: "/previews/Cream _ Drum Loop _ BPM 116.wav",
    },
    {
      id: "Sugar-drum-04",
      name: "Sugar _ Drum Loop _ BPM 98",
      file: "/previews/Sugar _ Drum Loop _ BPM 98.wav",
    },
    {
      id: "Vanilla-drum-05",
      name: "Vanilla _ DrumLoop _ BPM 100",
      file: "/previews/Vanilla _ DrumLoop _ BPM 100.wav",
    },
  ];

  const renderPreview = (sample, number) => (
    <div className="preview-item" key={sample.id}>
      <button
        type="button"
        className={`preview-play ${
          playing === sample.id ? "is-playing" : ""
        }`}
        onClick={() => togglePlay(sample.id)}
        aria-label={
          playing === sample.id
            ? `Pause ${sample.name}`
            : `Play ${sample.name}`
        }
      >
        {playing === sample.id ? "❚❚" : "▶"}
      </button>

      <div className="preview-number">
        {String(number).padStart(2, "0")}
      </div>

      <div className="preview-info">
        <strong>{sample.name}</strong>
        <span>Preview</span>
      </div>

      <audio
        ref={(element) => {
          audioRefs.current[sample.id] = element;
        }}
        src={sample.file}
        onEnded={handleEnded}
        preload="metadata"
      />
    </div>
  );

  return (
    <main className="cake-page">

      {/* HERO */}
      <section className="cake-hero">
        <div className="cake-image-wrapper">
          <img
            src="/caveman-cake.jpg"
            alt="Caveman Cake Slice 1 Sample Pack"
            className="cake-image"
          />
        </div>

        <div className="cake-info">
          <p className="brand">CAVE TUNES PRESENTS</p>

          <h1>Caveman Cake</h1>

          <h2>Slice 1</h2>

          <p className="description">
            A carefully crafted collection of original sounds created for
            producers, beatmakers, artists and composers looking for fresh
            ingredients for their music.
          </p>

          <div className="price">
            Download The Pack
          </div>

          <button
            type="button"
            className="buy-button"
            onClick={handleContinue}
          >
            CONTINUE TO DOWNLOAD
          </button>

          <p className="small-note">
            Digital product • No physical product will be delivered
          </p>
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="included">
        <p className="section-label">WHAT'S INSIDE</p>

        <h2>
          Fresh ingredients for your production.
        </h2>

        <div className="ingredient-grid">
          <div className="ingredient">
            <span>01</span>
            <h3>Melody Loops</h3>
            <p>
              Original melodic ideas created for building unique
              productions. You can use them as-is or manipulate them
              to create your own. Any genre can fit with these
              melodies, from Hip Hop to RnB, Pop, Trap and more.
            </p>
          </div>

          <div className="ingredient">
            <span>02</span>
            <h3>Drum Loops</h3>
            <p>
              Carefully designed drum sounds for adding punch,
              rhythm and character. A variety of drum hits, loops
              and patterns featuring Afrobeat, Afro-Dancehall,
              Afro-House and more.
            </p>
          </div>

          <div className="ingredient">
            <span>03</span>
            <h3>Textures</h3>
            <p>
              Atmospheric and creative sounds for adding depth
              and movement to your productions.
            </p>
          </div>

          <div className="ingredient">
            <span>04</span>
            <h3>One Shots</h3>
            <p>
              Individual sounds designed to give producers
              quick creative starting points.
            </p>
          </div>

          <div className="ingredient">
            <span>05</span>
            <h3>MIDI</h3>
            <p>
              MIDI files for the included melodies, allowing you
              to customize notes, chords and rhythms to fit your
              own productions.
            </p>
          </div>
        </div>
      </section>

      {/* PREVIEW SAMPLES */}
      <section className="preview-section">
        <div className="preview-header">
          <p className="section-label">LISTEN BEFORE YOU GET IT</p>

          <h2>
            Taste a few ingredients first.
          </h2>

          <p>
            Preview selected melody and drum loops from Caveman Cake
            Slice 1 before purchasing the full pack.
          </p>
        </div>

        <div className="preview-columns">

          {/* MELODIES */}
          <div className="preview-column">
            <div className="preview-column-title">
              <span>MELODY LOOPS</span>
              <strong>5 PREVIEWS</strong>
            </div>

            <div className="preview-list">
              {melodies.map((sample, index) =>
                renderPreview(sample, index + 1)
              )}
            </div>
          </div>

          {/* DRUMS */}
          <div className="preview-column">
            <div className="preview-column-title">
              <span>DRUM LOOPS</span>
              <strong>5 PREVIEWS</strong>
            </div>

            <div className="preview-list">
              {drums.map((sample, index) =>
                renderPreview(sample, index + 1)
              )}
            </div>
          </div>

        </div>

        <p className="preview-note">
          Preview audio is for listening purposes only. The full
          sample files are available with the complete pack.
        </p>
      </section>

      {/* PACK DETAILS */}
      <section className="information-section">
        <div className="information-header">
          <p className="section-label">PACK DETAILS</p>

          <h2>
            Everything you need to know before purchasing.
          </h2>
        </div>

        <div className="information-grid">

          <article className="information-card">
            <span>FORMAT</span>

            <h3>Digital Download</h3>

            <p>
              Caveman Cake Slice 1 is delivered as a digital sample
              pack. After a successful purchase, you will receive
              access to download the pack to your device.
            </p>
          </article>

          <article className="information-card">
            <span>CREATOR</span>

            <h3>Produced at Cave Tunes</h3>

            <p>
              The sounds in this pack are created and prepared
              under the Cave Tunes brand as part of the Caveman Cake
              sample-pack series.
            </p>
          </article>

          <article className="information-card">
            <span>USE</span>

            <h3>For Your Productions</h3>

            <p>
              You may use the sounds in your own music productions,
              beats, compositions, videos and other creative works
              according to the license terms below.
            </p>
          </article>

          <article className="information-card">
            <span>DELIVERY</span>

            <h3>Download After Purchase</h3>

            <p>
              This is a digital product. Nothing will be physically
              shipped. Download access will be provided after your
              payment has been successfully confirmed.
            </p>
          </article>

        </div>
      </section>

      {/* AGREEMENT */}
      <section className="agreement-section">
        <div className="agreement-box">
          <p className="section-label">LICENSE AGREEMENT</p>

          <h2>
            Use the ingredients. Don't redistribute the cake.
          </h2>

          <p>
            By purchasing Caveman Cake Slice 1, you receive a
            non-exclusive license to use the included sounds in
            your own creative productions.
          </p>

          <ul>
            <li>
              You may use the sounds in commercial and
              non-commercial music productions.
            </li>

            <li>
              You may combine, edit, process, arrange and
              manipulate the sounds in your own work.
            </li>

            <li>
              You may release music containing the sounds on
              streaming platforms, social media and other
              distribution platforms.
            </li>

            <li>
              You may not redistribute, resell or share the
              individual samples as a sample pack.
            </li>

            <li>
              You may not upload the original samples to another
              sample library or marketplace for redistribution.
            </li>

            <li>
              The purchase does not transfer ownership of the
              original sample recordings to the purchaser.
            </li>
          </ul>
        </div>
      </section>

      {/* IMPORTANT NOTES */}
      <section className="notes-section">
        <p className="section-label">IMPORTANT NOTES</p>

        <h2>Before you purchase</h2>

        <div className="notes-list">

          <div className="note">
            <strong>01 — DIGITAL PRODUCT</strong>

            <p>
              This is a digital product. No physical product will
              be delivered.
            </p>
          </div>

          <div className="note">
            <strong>02 — CHECK YOUR DEVICE</strong>

            <p>
              Make sure your device has enough available storage
              before downloading the sample pack.
            </p>
          </div>

          <div className="note">
            <strong>03 — KEEP YOUR DOWNLOAD SAFE</strong>

            <p>
              Store a backup of your downloaded files. Download
              access may be limited according to the product
              delivery system.
            </p>
          </div>

          <div className="note">
            <strong>04 — READ BEFORE PURCHASING</strong>

            <p>
              By continuing to purchase, you confirm that you have
              read and understood the product information and
              license agreement.
            </p>
          </div>

        </div>
      </section>

      {/* FINAL PURCHASE AREA */}
      <section className="purchase-section">
        <p className="section-label">
          CAVEMAN CAKE — SLICE 1
        </p>

        <h2>
          Ready to get your ingredients?
        </h2>

        <p>
          Continue to download Caveman Cake Slice 1.
        </p>

        <div className="final-price">
          Download The Pack
        </div>

        <button
          type="button"
          className="buy-button"
          onClick={handleContinue}
        >
          GET THE FULL PACK
        </button>
      </section>

      {/* FOOTER */}
      <footer>
        <strong>CAVEMAN CAKE</strong>

        <span>
          Produced at Cave Tunes
        </span>
      </footer>

    </main>
  );
}