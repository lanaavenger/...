const Constants = require('../util/Constants');

/**
 * Data structure that makes it easy to interact with a permission bitfield. All {@link GuildMember}s have a set of
 * permissions in their guild, and each channel in the guild may also have {@link PermissionOverwrites} for the member
 * that override their default permissions.
 */
class Permissions {
  /**
   * @param {GuildMember} [member] Member the permissions are for **(deprecated)**
   * @param {number} bitfield Permissions bitfield to read from
   */
  constructor(member, bitfield) {
    /**
     * Member the permissions are for
     * @type {GuildMember}
     * @deprecated
     */
    this.member = typeof member === 'object' ? member : null;

    /**
     * Bitfield of the packed permissions
     * @type {number}
     */
    this.bitfield = typeof member === 'object' ? bitfield : member;
  }

  /**
   * Bitfield of the packed permissions
   * @type {number}
   * @see {@link Permissions#bitfield}
   * @deprecated
   */
  get raw() {
    return this.bitfield;
  }

  set raw(raw) {
    this.bitfield = raw;
  }

  /**
   * Checks whether the bitfield has a permission, or multiple permissions.
   * @param {PermissionResolvable|PermissionResolvable[]} permission Permission(s) to check for
   * @param {boolean} [checkAdmin=true] Whether to allow the administrator permission to override
   * @returns {boolean}
   */
  has(permission, checkAdmin = true) {
    if (permission instanceof Array) return permission.every(p => this.has(p, checkAdmin));
    permission = this.constructor.resolve(permission);
    if (checkAdmin && (this.bitfield & this.constructor.FLAGS.ADMINISTRATOR) > 0) return true;
    return (this.bitfield & permission) === permission;
  }

  /**
   * Gets all given permissions that are missing from the bitfield.
   * @param {PermissionResolvable[]} permissions Permissions to check for
   * @param {boolean} [checkAdmin=true] Whether to allow the administrator permission to override
   * @returns {PermissionResolvable[]}
   */
  missing(permissions, checkAdmin = true) {
    return permissions.filter(p => !this.has(p, checkAdmin));
  }

  /**
   * Adds permissions to this one, creating a new instance to represent the new bitfield.
   * @param {...PermissionResolvable} permissions Permissions to add
   * @returns {Permissions}
   */
  add(...permissions) {
    let total = 0;
    for (let p = 0; p < permissions.length; p++) {
      const perm = this.constructor.resolve(permissions[p]);
      if ((this.bitfield & perm) !== perm) total |= perm;
    }
    return new this.constructor(this.member, this.bitfield | total);
  }

  /**
   * Removes permissions to this one, creating a new instance to represent the new bitfield.
   * @param {...PermissionResolvable} permissions Permissions to remove
   * @returns {Permissions}
   */
  remove(...permissions) {
    let total = 0;
    for (let p = 0; p < permissions.length; p++) {
      const perm = this.constructor.resolve(permissions[p]);
      if ((this.bitfield & perm) === perm) total |= perm;
    }
    return new this.constructor(this.member, this.bitfield & ~total);
  }

  /**
   * Gets an object mapping permission name (like `READ_MESSAGES`) to a {@link boolean} indicating whether the
   * permission is available.
   * @param {boolean} [checkAdmin=true] Whether to allow the administrator permission to override
   * @returns {Object}
   */
  serialize(checkAdmin = true) {
    const serialized = {};
    for (const perm in this.constructor.FLAGS) serialized[perm] = this.has(perm, checkAdmin);
    return serialized;
  }

  /**
   * Checks whether the user has a certain permission, e.g. `READ_MESSAGES`.
   * @param {PermissionResolvable} permission The permission to check for
   * @param {boolean} [explicit=false] Whether to require the user to explicitly have the exact permission
   * @returns {boolean}
   * @see {@link Permissions#has}
   * @deprecated
   */
  hasPermission(permission, explicit = false) {
    return this.has(permission, !explicit);
  }

  /**
   * Checks whether the user has all specified permissions.
   * @param {PermissionResolvable[]} permissions The permissions to check for
   * @param {boolean} [explicit=false] Whether to require the user to explicitly have the exact permissions
   * @returns {boolean}
   * @see {@link Permissions#has}
   * @deprecated
   */
  hasPermissions(permissions, explicit = false) {
    return this.has(permissions, !explicit);
  }

  /**
   * Checks whether the user has all specified permissions, and lists any missing permissions.
   * @param {PermissionResolvable[]} permissions The permissions to check for
   * @param {boolean} [explicit=false] Whether to require the user to explicitly have the exact permissions
   * @returns {PermissionResolvable[]}
   * @see {@link Permissions#missing}
   * @deprecated
   */
  missingPermissions(permissions, explicit = false) {
    return this.missing(permissions, !explicit);
  }

  /**
   * Data that can be resolved to give a permission number. This can be:
   * - A string (see {@link Permissions.flags})
   * - A permission number
   * @typedef {string|number} PermissionResolvable
   */

  /**
   * Resolves permissions to their numeric form.
   * @param {PermissionResolvable|Permissions[]} permission - Permission(s) to resolve
   * @returns {number|number[]}
   */
  static resolve(permission) {
    if (permission instanceof Array) return permission.map(p => this.resolve(p));
    if (typeof permission === 'string') permission = this.FLAGS[permission];
    if (typeof permission !== 'number' || permission < 1) throw new RangeError(Constants.Errors.NOT_A_PERMISSION);
    return permission;
  }
}

/**
 * Numeric permission flags. All available properties:
 * - `ADMINISTRATOR` (implicitly has *all* permissions, and bypasses all channel overwrites)
 * - `CREATE_INSTANT_INVITE` (create invitations to the guild)
 * - `KICK_MEMBERS`
 * - `BAN_MEMBERS`
 * - `MANAGE_CHANNELS` (edit and reorder channels)
 * - `MANAGE_GUILD` (edit the guild information, region, etc.)
 * - `ADD_REACTIONS` (add new reactions to messages)
 * - `READ_MESSAGES`
 * - `SEND_MESSAGES`
 * - `SEND_TTS_MESSAGES`
 * - `MANAGE_MESSAGES` (delete messages and reactions)
 * - `EMBED_LINKS` (links posted will have a preview embedded)
 * - `ATTACH_FILES`
 * - `READ_MESSAGE_HISTORY` (view messages that were posted prior to opening Discord)
 * - `MENTION_EVERYONE`
 * - `USE_EXTERNAL_EMOJIS` (use emojis from different guilds)
 * - `EXTERNAL_EMOJIS` **(deprecated)**
 * - `CONNECT` (connect to a voice channel)
 * - `SPEAK` (speak in a voice channel)
 * - `MUTE_MEMBERS` (mute members across all voice channels)
 * - `DEAFEN_MEMBERS` (deafen members across all voice channels)
 * - `MOVE_MEMBERS` (move members between voice channels)
 * - `USE_VAD` (use voice activity detection)
 * - `CHANGE_NICKNAME`
 * - `MANAGE_NICKNAMES` (change other members' nicknames)
 * - `MANAGE_ROLES`
 * - `MANAGE_ROLES_OR_PERMISSIONS` **(deprecated)**
 * - `MANAGE_WEBHOOKS`
 * - `MANAGE_EMOJIS`
 * @type {Object}
 * @see {@link https://discordapp.com/developers/docs/topics/permissions}
 */
Permissions.FLAGS = {
  CREATE_INSTANT_INVITE: 1 << 0,
  KICK_MEMBERS: 1 << 1,
  BAN_MEMBERS: 1 << 2,
  ADMINISTRATOR: 1 << 3,
  MANAGE_CHANNELS: 1 << 4,
  MANAGE_GUILD: 1 << 5,
  ADD_REACTIONS: 1 << 6,

  READ_MESSAGES: 1 << 10,
  SEND_MESSAGES: 1 << 11,
  SEND_TTS_MESSAGES: 1 << 12,
  MANAGE_MESSAGES: 1 << 13,
  EMBED_LINKS: 1 << 14,
  ATTACH_FILES: 1 << 15,
  READ_MESSAGE_HISTORY: 1 << 16,
  MENTION_EVERYONE: 1 << 17,
  EXTERNAL_EMOJIS: 1 << 18,
  USE_EXTERNAL_EMOJIS: 1 << 18,

  CONNECT: 1 << 20,
  SPEAK: 1 << 21,
  MUTE_MEMBERS: 1 << 22,
  DEAFEN_MEMBERS: 1 << 23,
  MOVE_MEMBERS: 1 << 24,
  USE_VAD: 1 << 25,

  CHANGE_NICKNAME: 1 << 26,
  MANAGE_NICKNAMES: 1 << 27,
  MANAGE_ROLES: 1 << 28,
  MANAGE_ROLES_OR_PERMISSIONS: 1 << 28,
  MANAGE_WEBHOOKS: 1 << 29,
  MANAGE_EMOJIS: 1 << 30,
};

/**
 * Bitfield representing every permission combined
 * @type {number}
 */
Permissions.ALL = Object.keys(Permissions.FLAGS).reduce((all, p) => all | Permissions.FLAGS[p], 0);

/**
 * Bitfield representing the default permissions for users
 * @type {number}
 */
Permissions.DEFAULT = 104324097;

/**
 * @class EvaluatedPermissions
 * @classdesc The final evaluated permissions for a member in a channel
 * @see {@link Permissions}
 * @deprecated
 */

module.exports = Permissions;
