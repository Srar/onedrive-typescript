export default class Cache<T> {

    private cacheHash: {
        [key: string]: {
            life: number,
            value: T
        }
    } = {};

    private lifeKiller: number = null;

    constructor() {
        this.lifeKiller = setInterval(this.killer.bind(this), 1000 * 1);
    }

    private killer() {
        var time = new Date().getTime();
        Object.keys(this.cacheHash).forEach(key => {
            var cache = this.cacheHash[key];
            if (cache.life < time) delete this.cacheHash[key];
        });
    }

    destory() {
        clearInterval(this.lifeKiller);
        Object.keys(this.cacheHash).forEach(key => {
            delete this.cacheHash[key];
        });
    }

    set(key: string, value: T, life: number) {
        this.cacheHash[key] = {
            value: value,
            life: new Date().getTime() + (life * 1000)
        }
    }

    get(key: string): T {
        var cache = this.cacheHash[key];
        if (cache == undefined) return null;
        if (cache.life < new Date().getTime()) {
            delete this.cacheHash[key];
            return null;
        }
        return cache.value;
    }

}