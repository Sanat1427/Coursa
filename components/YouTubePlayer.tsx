"use client";
import React, { useEffect, useRef } from "react";

type Props = {
    videoId: string;
    onPlayerReady: (player: any) => void;
};

export default function YouTubePlayer({ videoId, onPlayerReady }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        let player: any = null;
        let isMounted = true;

        const initPlayer = () => {
            if (!containerRef.current || !(window as any).YT) return;

            // Clear previous content and create a dedicated DOM element for the player
            containerRef.current.innerHTML = "";
            const playerElement = document.createElement("div");
            playerElement.className = "w-full h-full";
            containerRef.current.appendChild(playerElement);

            player = new (window as any).YT.Player(playerElement, {
                height: "100%",
                width: "100%",
                videoId: videoId,
                playerVars: {
                    autoplay: 0,
                    rel: 0,
                    modestbranding: 1,
                },
                events: {
                    onReady: (event: any) => {
                        if (isMounted) {
                            playerRef.current = event.target;
                            onPlayerReady(event.target);
                        }
                    },
                },
            });
        };

        if ((window as any).YT && (window as any).YT.Player) {
            initPlayer();
        } else {
            // Load the YouTube API script if not already present
            if (!document.getElementById("youtube-iframe-api-script")) {
                const tag = document.createElement("script");
                tag.id = "youtube-iframe-api-script";
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName("script")[0];
                firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
            }

            // Register global ready callback
            const prevCallback = (window as any).onYouTubeIframeAPIReady;
            (window as any).onYouTubeIframeAPIReady = () => {
                if (prevCallback) prevCallback();
                if (isMounted) {
                    initPlayer();
                }
            };
        }

        return () => {
            isMounted = false;
            if (player && player.destroy) {
                player.destroy();
            }
        };
    }, [videoId]);

    return (
        <div ref={containerRef} className="w-full h-full" />
    );
}
