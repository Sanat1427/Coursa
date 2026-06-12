"use client";
import React, { useState, useEffect, useRef } from "react";
import { Play } from "lucide-react";

type Props = {
    videoId: string;
    onPlayerReady: (player: any) => void;
};

export default function YouTubePlayer({ videoId, onPlayerReady }: Props) {
    const [isLoaded, setIsLoaded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        if (!isLoaded) return;

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
                    autoplay: 1,
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
    }, [videoId, isLoaded]);

    if (!isLoaded) {
        return (
            <div 
                className="relative w-full h-full cursor-pointer group flex items-center justify-center overflow-hidden bg-cover bg-center"
                style={{ backgroundImage: `url(https://img.youtube.com/vi/${videoId}/hqdefault.jpg)` }}
                onClick={() => setIsLoaded(true)}
            >
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors duration-300 animate-fade-in" />
                
                {/* Wobbly play button container */}
                <div className="relative z-10 w-16 h-16 bg-sketch-primary hover:bg-black border-2 border-black rounded-full flex items-center justify-center hard-shadow hover:scale-105 transition-all duration-300">
                    <Play className="w-8 h-8 text-white fill-white translate-x-0.5" />
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="w-full h-full" />
    );
}

