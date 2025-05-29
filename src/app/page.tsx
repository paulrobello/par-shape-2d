import {GameCanvas} from '@/components/game/GameCanvas';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-0 m-0 md:min-h-screen md:justify-center">
            {/* Rotation notice overlay */}
            <div className="rotation-notice">
                <div className="rotation-icon">📱</div>
                <h2>Please Rotate Your Device</h2>
                <p>This game is designed for portrait mode only. Please rotate your device to portrait orientation for
                    the best experience.</p>
            </div>

            <header className="mb-1 text-center hidden md:block">
                <h1 className="font-bold text-white mb-2">PAR Shape 2D</h1>
            </header>

            <main className="flex flex-col items-center w-full h-full md:w-auto md:h-auto">
                <GameCanvas/>
            </main>

            <footer className="mt-8 text-center text-gray-500 text-sm hidden md:block">
                <p>Created entirely with AI by Paul Robello</p>
            </footer>
        </div>
    );
}
