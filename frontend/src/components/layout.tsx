import { PaperAirplaneIcon, MinusIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef } from "react";
import { WindowMinimise, Quit } from "../../wailsjs/runtime/runtime";
import { twMerge } from "tailwind-merge";

export const Layout: React.FC<
  React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>
> = ({ className, children, ...props }) => {
  const refDraggable = useRef<HTMLDivElement>(null);
  const refNonDraggable = useRef<HTMLDivElement>(null);

  // Hack to add custom attributes to make the window draggable
  useEffect(() => {
    if (refDraggable.current) {
      refDraggable.current.setAttribute("style", "--wails-draggable:drag");
    }
  }, [refDraggable]);

  useEffect(() => {
    if (refNonDraggable.current) {
      refNonDraggable.current.setAttribute(
        "style",
        "--wails-draggable:no-drag",
      );
    }
  }, [refNonDraggable]);

  return (
    <div
      className={twMerge(
        "h-screen w-screen flex flex-col overflow-clip px-3 gap-1",
        className,
      )}
      {...props}
    >
      <div
        ref={refDraggable}
        className="mb-1 w-full justify-start items-center gap-1 flex cursor-default pt-2 shrink grow-0"
      >
        <PaperAirplaneIcon className="size-4 text-white" />
        <p className="select-none font-bold text-white">DCSFlightTracker</p>
        <div
          ref={refNonDraggable}
          className="absolute right-3 top-3 flex justify-end gap-1"
        >
          <button
            className="cs-btn size-4.5 flex items-center justify-center cursor-pointer"
            onClick={() => WindowMinimise()}
          >
            <MinusIcon className="size-3 absolute" />
          </button>
          <button
            className="cursor-pointer cs-btn aspect-square close"
            onClick={() => Quit()}
          />
        </div>
      </div>

      <div className="flex flex-col overflow-hidden h-full">{children}</div>
    </div>
  );
};
