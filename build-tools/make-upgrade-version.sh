#!/bin/sh
set -eu

ACTION="${1:-release}"
VERSION_TYPE="${2:-}"
DRY_RUN="${DRY_RUN:-0}"
RELEASE_BRANCH="${RELEASE_BRANCH:-master}"

case "$ACTION" in
	patch | minor | major)
		VERSION_TYPE="$ACTION"
		ACTION='release'
		;;
	'' | release | prepare | finalize) ;;
	*)
		echo "Acción inválida: $ACTION" >&2
		exit 1
		;;
esac

run_cmd() {
	if [ "$DRY_RUN" = "1" ]; then
		printf '[dry-run]'
		for arg in "$@"; do
			printf ' %s' "$arg"
		done
		printf '\n'
		return 0
	fi

	"$@"
}

ensure_valid_version_type() {
	case "$1" in
		patch | minor | major) ;;
	*)
		echo "Tipo de versión inválido: $1" >&2
		exit 1
		;;
	esac
}

read_package_version() {
	PACKAGE_VERSION="$(sed -n 's/.*"version":[[:space:]]*"\([^"]*\)".*/\1/p' package.json | sed -n '1p' | tr -d '\r')"

	if [ -z "$PACKAGE_VERSION" ]; then
		echo 'No se pudo leer la versión actual desde package.json.' >&2
		exit 1
	fi

	printf '%s' "$PACKAGE_VERSION"
}

resolve_version_type() {
	PACKAGE_VERSION="$(read_package_version)"

	if [ -n "$VERSION_TYPE" ]; then
		ensure_valid_version_type "$VERSION_TYPE"
	else
	PATCH_VERSION="$(npx semver "$PACKAGE_VERSION" -i patch | tr -d '\r')"
	MINOR_VERSION="$(npx semver "$PACKAGE_VERSION" -i minor | tr -d '\r')"
	MAJOR_VERSION="$(npx semver "$PACKAGE_VERSION" -i major | tr -d '\r')"

	echo "Selecciona el tipo de incremento de versión:"
	echo "  1) patch ($PACKAGE_VERSION -> $PATCH_VERSION)"
	echo "  2) minor ($PACKAGE_VERSION -> $MINOR_VERSION)"
	echo "  3) major ($PACKAGE_VERSION -> $MAJOR_VERSION)"
	printf 'Introduce el número (1-3): '
	read -r choice

	case "$choice" in
	1) VERSION_TYPE="patch" ;;
	2) VERSION_TYPE="minor" ;;
	3) VERSION_TYPE="major" ;;
	*)
			echo 'Selección inválida. Abortando.' >&2
			exit 1
			;;
	esac
	fi

	if [ "$VERSION_TYPE" = "major" ]; then
		printf '¿Estás seguro que quieres subir a una versión de tipo MAJOR? [y/N] '
		read -r confirm
		if [ "$confirm" != 'y' ] && [ "$confirm" != 'Y' ]; then
			echo 'Abortando.' >&2
			exit 1
		fi
	fi
}

prepare_release() {
	PACKAGE_VERSION="$(read_package_version)"
	NEW_PACKAGE_VERSION="$(npx semver "$PACKAGE_VERSION" -i "$VERSION_TYPE" | tr -d '\r')"

	echo "Incrementando versión con tipo: $VERSION_TYPE..."
	run_cmd npm run development:update-version -- "$VERSION_TYPE"

	echo 'Actualizando package-lock.json...'
	run_cmd npm i
}

finalize_release() {
	NEW_PACKAGE_VERSION="$(read_package_version)"

	echo "Committing y etiquetando nueva versión: v$NEW_PACKAGE_VERSION..."
	run_cmd git add package.json package-lock.json src/apps/mybandnow/backend/config/swagger/definition.json
	run_cmd git commit -m "chore(release): Bump version to v$NEW_PACKAGE_VERSION"
	run_cmd git tag -a "v$NEW_PACKAGE_VERSION" -m "v$NEW_PACKAGE_VERSION"
	run_cmd git push origin --tags
	run_cmd git push origin "$RELEASE_BRANCH"

	echo ''
	echo "¡Versión actualizada a v$NEW_PACKAGE_VERSION!"
}

case "$ACTION" in
	prepare)
		resolve_version_type
		prepare_release
		;;
	finalize)
		finalize_release
		;;
	release)
		resolve_version_type
		prepare_release
		finalize_release
		;;
esac
