import { useEffect, useRef, useState } from "react";

function WrittenNotesSection({
  lesson,
  onComplete,
}) {
  const actionRef = useRef(null);

  const tasks =
    lesson?.writtenNotes?.tasks || [];

  const [stage, setStage] = useState("intro");
  const [taskIndex, setTaskIndex] = useState(0);

  const [originalWritten, setOriginalWritten] =
    useState(false);

  const [photoFile, setPhotoFile] =
    useState(null);

  const [photoPreview, setPhotoPreview] =
    useState(null);

  // =========================
  // SMOOTHLY SHOW NEW STAGE
  // =========================

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const element = actionRef.current;

      if (!element) return;

      // First move the viewport smoothly
      // to the useful interactive area.
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      // Then focus it WITHOUT causing
      // another browser scroll.
      requestAnimationFrame(() => {
        try {
          element.focus({
            preventScroll: true,
          });
        } catch {
          element.focus();
        }
      });
    }, 50);

    return () => {
      window.clearTimeout(timer);
    };
  }, [stage, taskIndex]);

  // =========================
  // CLEANUP PHOTO PREVIEW
  // =========================

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const currentTask =
    tasks[taskIndex];

  // =========================
  // SKIP
  // =========================

  function skipSection() {
    onComplete();
  }

  // =========================
  // START
  // =========================

  function startSection() {
    if (!tasks.length) {
      setStage("original");
      return;
    }

    setTaskIndex(0);
    setStage("task");
  }

  // =========================
  // FINISH PAPER TASK
  // =========================

  function finishTask() {
    setStage("reveal");
  }

  // =========================
  // NEXT TASK
  // =========================

  function nextTask() {
    if (taskIndex < tasks.length - 1) {
      setTaskIndex(
        (previous) => previous + 1
      );

      setStage("task");

      return;
    }

    setStage("original");
  }

  // =========================
  // ORIGINAL SENTENCE
  // =========================

  function handleOriginalWritten() {
    setOriginalWritten(true);
    setStage("save");
  }

  // =========================
  // PHOTO SELECTED
  // =========================

  function handlePhotoChange(event) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);

    setPhotoPreview(
      URL.createObjectURL(file)
    );
  }

  // =========================
  // SAVE PHOTO
  // =========================

  function savePhoto() {
    if (!photoFile) {
      onComplete();
      return;
    }

    try {
      const reader =
        new FileReader();

      reader.onload = () => {
        const savedPhoto = {
          lessonId: lesson.id,
          fileName: photoFile.name,
          mimeType: photoFile.type,
          image: reader.result,
          savedAt: Date.now(),
        };

        localStorage.setItem(
          `frenchin10_written_photo_${lesson.id}`,
          JSON.stringify(savedPhoto)
        );

        localStorage.setItem(
          `frenchin10_written_completed_${lesson.id}`,
          JSON.stringify({
            lessonId: lesson.id,
            originalWritten,
            completedAt: Date.now(),
          })
        );

        onComplete();
      };

      reader.readAsDataURL(photoFile);
    } catch (error) {
      console.error(
        "Failed to save writing photo:",
        error
      );

      onComplete();
    }
  }

  // =========================
  // SKIP PHOTO
  // =========================

  function skipPhoto() {
    localStorage.setItem(
      `frenchin10_written_completed_${lesson.id}`,
      JSON.stringify({
        lessonId: lesson.id,
        originalWritten,
        completedAt: Date.now(),
      })
    );

    onComplete();
  }

  // =========================
  // EMPTY STATE
  // =========================

  if (!tasks.length) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">

        <h2 className="text-3xl font-bold text-slate-800">
          Write & Remember
        </h2>

        <p className="text-gray-500 mt-3">
          No writing tasks are configured
          for this lesson yet.
        </p>

        <button
          ref={actionRef}
          type="button"
          onClick={onComplete}
          className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-xl"
        >
          Continue →
        </button>

      </div>
    );
  }

  // =========================
  // INTRO
  // =========================

  if (stage === "intro") {
    return (
      <div className="max-w-3xl mx-auto">

        <div className="text-center">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold">
            <span>✍️</span>
            <span>Memory Challenge</span>
          </div>

          <h2 className="text-4xl font-bold text-slate-800 mt-5 tracking-tight">
            Let’s see what you remember.
          </h2>

          <p className="text-gray-500 mt-3 text-lg">
            No notes. No hints. Just you and your memory.
          </p>

        </div>

        <div className="relative mt-10">

          <div className="absolute -inset-1 bg-emerald-100/50 rounded-[28px] blur-xl" />

          <div className="relative bg-white border border-gray-200 rounded-3xl shadow-lg overflow-hidden">

            <div className="h-1.5 bg-emerald-500" />

            <div className="p-8 md:p-10">

              {/* PAPER MESSAGE */}

              <div className="flex items-start gap-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5">

                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl">
                  📝
                </div>

                <div>
                  <p className="font-bold text-slate-800">
                    Grab a pen & paper
                  </p>

                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    You're going to pull some French
                    straight from your memory. Don't worry
                    about getting everything perfect.
                  </p>
                </div>

              </div>

              {/* CHALLENGE */}

              <div className="mt-9">

                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
                  Your challenge
                </p>

                <div className="space-y-4">

                  <div className="flex gap-4 items-center">

                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      1
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        Recall two sentences
                      </p>

                      <p className="text-sm text-gray-500">
                        Write them in French from memory.
                      </p>
                    </div>

                  </div>

                  <div className="ml-5 h-3 border-l border-dashed border-gray-200" />

                  <div className="flex gap-4 items-center">

                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                      2
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        Reveal & compare
                      </p>

                      <p className="text-sm text-gray-500">
                        See the answer and check what you remembered.
                      </p>
                    </div>

                  </div>

                  <div className="ml-5 h-3 border-l border-dashed border-gray-200" />

                  <div className="flex gap-4 items-center">

                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold">
                      3
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        Make it yours
                      </p>

                      <p className="text-sm text-gray-500">
                        Write one original French sentence.
                      </p>
                    </div>

                  </div>

                  <div className="ml-5 h-3 border-l border-dashed border-gray-200" />

                  <div className="flex gap-4 items-center">

                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                      4
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        Keep your progress
                      </p>

                      <p className="text-sm text-gray-500">
                        Optionally take a photo of your writing.
                      </p>
                    </div>

                  </div>

                </div>

              </div>

              {/* REASSURANCE */}

              <div className="mt-9 flex items-center justify-center gap-2 text-sm text-gray-400">

                <span>🔓</span>

                <span>
                  No grades. No pressure. Just practice.
                </span>

              </div>

              {/* CTA */}

              <button
                ref={actionRef}
                type="button"
                onClick={startSection}
                className="group w-full mt-7 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                <span className="inline-flex items-center justify-center gap-2">
                  Start the challenge

                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={skipSection}
                className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 py-2 transition"
              >
                Skip this activity
              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }

  // =========================
  // PAPER TASK
  // =========================

  if (
    stage === "task" &&
    currentTask
  ) {
    return (
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-8">

          <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
            From memory
          </p>

          <h2 className="text-3xl font-bold text-slate-800 mt-2">
            Sentence {taskIndex + 1} of{" "}
            {tasks.length}
          </h2>

          <p className="text-gray-500 mt-3">
            Write this in French on paper
            without looking back.
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

          <div className="bg-gray-50 rounded-2xl p-8 text-center">

            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
              Your task
            </p>

            <p className="text-2xl font-bold text-slate-800 mt-5">
              {currentTask.english}
            </p>

          </div>

          <div className="mt-7">

            <button
              ref={actionRef}
              type="button"
              onClick={finishTask}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
            >
              I've written it →
            </button>

            <button
              type="button"
              onClick={skipSection}
              className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 py-2"
            >
              Skip
            </button>

          </div>

        </div>

      </div>
    );
  }

  // =========================
  // REVEAL
  // =========================

  if (
    stage === "reveal" &&
    currentTask
  ) {
    return (
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-8">

          <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
            Compare
          </p>

          <h2 className="text-3xl font-bold text-slate-800 mt-2">
            Here's the answer
          </h2>

          <p className="text-gray-500 mt-3">
            Compare it with what you wrote.
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

          <div className="bg-emerald-50 rounded-2xl p-7 text-center">

            <p className="text-xs uppercase tracking-wide text-emerald-600 font-semibold">
              Expected answer
            </p>

            <p className="text-2xl font-bold text-slate-800 mt-4">
              {currentTask.answer}
            </p>

          </div>

          <p className="text-center text-sm text-gray-400 mt-5">
            No score — just compare and learn.
          </p>

          <button
            ref={actionRef}
            type="button"
            onClick={nextTask}
            className="w-full mt-7 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
          >
            {taskIndex < tasks.length - 1
              ? "Next sentence →"
              : "Now make it yours →"}
          </button>

          <button
            type="button"
            onClick={skipSection}
            className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 py-2"
          >
            Skip
          </button>

        </div>

      </div>
    );
  }

  // =========================
  // ORIGINAL SENTENCE
  // =========================

  if (stage === "original") {
    return (
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-8">

          <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
            Make it yours
          </p>

          <h2 className="text-3xl font-bold text-slate-800 mt-2">
            Write your own sentence
          </h2>

          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Use something you learned in this
            lesson to create one original French
            sentence.
          </p>

          <p className="text-sm text-gray-400 mt-2">
            It doesn't have to be perfect.
            Just try to use what you remember.
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

          <div className="bg-emerald-50 rounded-xl p-5 text-center">

            <p className="text-emerald-700 font-semibold">
              Your sentence
            </p>

            <p className="text-sm text-emerald-600 mt-2">
              Write it on paper.
            </p>

          </div>

          <button
            ref={actionRef}
            type="button"
            onClick={handleOriginalWritten}
            className="w-full mt-7 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
          >
            I've written it →
          </button>

          <button
            type="button"
            onClick={skipSection}
            className="w-full mt-3 text-sm text-gray-400 hover:text-gray-600 py-2"
          >
            Skip
          </button>

        </div>

      </div>
    );
  }

  // =========================
  // SAVE PHOTO
  // =========================

  if (stage === "save") {
    return (
      <div className="max-w-3xl mx-auto">

        <div className="text-center mb-8">

          <p className="text-sm text-emerald-600 font-semibold uppercase tracking-wide">
            Keep it for later
          </p>

          <h2 className="text-3xl font-bold text-slate-800 mt-2">
            📸 Save your writing
          </h2>

          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Take a photo of what you wrote and
            keep it with this lesson. You can
            look back at it later in Review.
          </p>

        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">

          {photoPreview ? (
            <div>

              <img
                src={photoPreview}
                alt="Your handwritten notes"
                className="w-full max-h-[420px] object-contain rounded-xl border border-gray-200 bg-gray-50"
              />

              <button
                ref={actionRef}
                type="button"
                onClick={savePhoto}
                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Save with this lesson →
              </button>

              <label className="block mt-3">

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />

                <span className="block w-full text-center cursor-pointer border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition">
                  Choose another photo
                </span>

              </label>

            </div>
          ) : (
            <div>

              <label className="block">

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />

                <span
                  ref={actionRef}
                  tabIndex={0}
                  className="block w-full text-center cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
                >
                  📷 Take a photo
                </span>

              </label>

              <p className="text-center text-sm text-gray-400 mt-4">
                Your photo is only saved locally
                for this demo.
              </p>

            </div>
          )}

          <button
            type="button"
            onClick={skipPhoto}
            className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 py-2"
          >
            Skip and continue →
          </button>

        </div>

      </div>
    );
  }

  return null;
}

export default WrittenNotesSection;