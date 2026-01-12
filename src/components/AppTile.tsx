import { Download } from 'lucide-react';

export interface AppData {
    name: string;
    icon?: string;
    alt?: string;
    url?: string;
    path?: string;
}

interface AppTileProps {
    app: AppData;
    isInstallable: boolean;
    onInstall: () => void;
    onNavigate: (path: string) => void;
    onOpenUrl: (url: string) => void;
    variant?: 'small' | 'large';
}

export const AppTile = ({
    app,
    isInstallable,
    onInstall,
    onNavigate,
    onOpenUrl,
    variant = 'small'
}: AppTileProps) => {
    const isSmall = variant === 'small';

    const containerClasses = [
        'aspect-square rounded-xl flex flex-col items-center justify-center text-center transition-transform hover:scale-105 cursor-pointer',
        isSmall ? 'p-4' : 'p-6',
        app.icon
            ? `bg-white border-2 border-[hsl(var(--navy))] shadow-lg ${!isSmall ? 'hover:shadow-xl' : ''}`
            : 'bg-white border-2 border-dashed border-muted-foreground/30'
    ].join(' ');

    const iconClasses = [
        'mb-2 object-cover rounded-lg',
        isSmall ? 'w-icon-sm h-icon-sm md:w-icon-md md:h-icon-md' : 'w-icon-lg h-icon-lg md:w-icon-xl md:h-icon-xl mb-3'
    ].join(' ');

    const textClasses = [
        'font-medium text-[hsl(var(--navy))]',
        isSmall ? 'text-xs md:text-sm' : 'text-sm md:text-base font-semibold'
    ].join(' ');

    const placeholderClasses = [
        'text-muted-foreground',
        isSmall ? 'text-xs md:text-sm' : 'text-sm md:text-base font-medium'
    ].join(' ');

    const badgeClasses = [
        'absolute bg-[hsl(var(--navy))] text-white rounded-full shadow-lg animate-pulse',
        'p-1 -top-1 -right-1', // Small variant defaults (adjust if large is different)
    ].join(' ');

    const handleClick = () => {
        if (app.name === 'APEX' && isInstallable) {
            onInstall();
        } else if (app.url) {
            onOpenUrl(app.url);
        } else if (app.path) {
            onNavigate(app.path);
        }
    };

    return (
        <div
            role="group"
            aria-label={`${app.name} tile`}
            className={containerClasses}
            onClick={handleClick}
        >
            {app.icon ? (
                <>
                    <div className="relative">
                        <img
                            src={app.icon}
                            alt={app.alt}
                            className={iconClasses}
                        />
                        {app.name === 'APEX' && isInstallable && (
                            <div className={`absolute bg-[hsl(var(--navy))] text-white rounded-full shadow-lg animate-pulse ${isSmall ? '-top-1 -right-1 p-1' : '-top-2 -right-2 p-2'}`}>
                                <Download className={isSmall ? "w-3 h-3" : "w-4 h-4 md:w-5 md:h-5"} />
                            </div>
                        )}
                    </div>
                    <span className={textClasses}>
                        {app.name}
                    </span>
                </>
            ) : (
                <span className={placeholderClasses}>
                    {app.name}
                </span>
            )}
        </div>
    );
};
