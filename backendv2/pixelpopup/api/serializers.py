from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from pixelpopup.models import Page, Scene, Asset, ClientRequest, Payment
from .validation import validate_scene_data


class AssetSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Asset
        fields = ("id", "type", "label", "mime", "meta", "file_url")

    def get_file_url(self, obj):
        request = self.context.get("request")
        if not obj.file:
            return ""
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class SceneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scene
        fields = (
            "id",
            "page",
            "key",
            "type",
            "order",
            "data",
            "renderer",
            "theme_override_id",
            "theme_override_settings",
        )

    def validate_data(self, value):
        # 1) Structural validation (no DB lookups)
        scene_type = self.initial_data.get("type") or getattr(self.instance, "type", None)
        validate_scene_data(scene_type, value)

        # 2) Reference validation (DB-aware)
        page = None
        if self.instance and self.instance.page_id:
            page = self.instance.page
        else:
            page_id = self.initial_data.get("page")
            if page_id:
                page = Page.objects.filter(id=page_id).first()

        if page:
            self._validate_references(page=page, scene_type=scene_type, data=value)

        return value

    def _validate_references(self, page: Page, scene_type: str, data: dict) -> None:
        # Existing scene keys for this page
        scene_keys = set(Scene.objects.filter(page=page).values_list("key", flat=True))

        # Asset ids for this page
        asset_ids = set(Asset.objects.filter(page=page).values_list("id", flat=True))

        # Collect references inside scene.data
        used_assets, used_scenes, used_targets = self._collect_refs(data)

        # Validate assets exist
        missing_assets = sorted(list(used_assets - asset_ids))
        if missing_assets:
            raise ValidationError({"data": f"Missing asset(s) for this page: {missing_assets}"})

        # Validate referenced scene keys exist
        # Note: you’re using scene_id as key in schema examples (sc_intro). If you use numeric IDs, adjust this.
        missing_scenes = sorted(list(used_scenes - scene_keys))
        if missing_scenes:
            raise ValidationError({"data": f"Missing scene key(s) for this page: {missing_scenes}"})

        # Best-effort validate target_id exists among objects
        obj_ids = set()
        for obj in (data.get("objects") or []):
            if isinstance(obj, dict) and isinstance(obj.get("id"), str):
                obj_ids.add(obj["id"])

        missing_targets = sorted(list(used_targets - obj_ids))
        # Don’t hard-fail for targets that might be “virtual” in custom renderers,
        # but for schema scenes it's usually a real mistake. You can choose strict.
        if missing_targets:
            raise ValidationError({"data": f"Action target_id(s) not found in objects: {missing_targets}"})

    def _collect_refs(self, data: dict):
        used_assets = set()
        used_scenes = set()
        used_targets = set()

        # background asset
        bg = data.get("background") or {}
        if isinstance(bg, dict) and bg.get("asset_id"):
            used_assets.add(str(bg["asset_id"]))

        # audio asset
        au = data.get("audio") or {}
        if isinstance(au, dict) and au.get("asset_id"):
            used_assets.add(str(au["asset_id"]))

        # Scene-type blocks that may reference assets
        letter = data.get("letter") or {}
        if isinstance(letter, dict) and letter.get("image_fill_asset_id"):
            used_assets.add(str(letter["image_fill_asset_id"]))

        map_block = data.get("map") or {}
        if isinstance(map_block, dict) and map_block.get("map_asset_id"):
            used_assets.add(str(map_block["map_asset_id"]))

        exploration = data.get("exploration") or {}
        if isinstance(exploration, dict):
            if exploration.get("world_asset_id"):
                used_assets.add(str(exploration["world_asset_id"]))
            if exploration.get("player_sprite_asset_id"):
                used_assets.add(str(exploration["player_sprite_asset_id"]))

        # Traverse objects -> triggers -> actions
        for obj in (data.get("objects") or []):
            if not isinstance(obj, dict):
                continue
            content = obj.get("content") or {}
            if isinstance(content, dict):
                # common asset usage in content
                if content.get("asset_id"):
                    used_assets.add(str(content["asset_id"]))
                # popup content could include media arrays, etc. (optional)
                media = content.get("media")
                if isinstance(media, list):
                    for m in media:
                        if isinstance(m, dict) and m.get("asset_id"):
                            used_assets.add(str(m["asset_id"]))

            triggers = obj.get("triggers") or []
            for t in triggers:
                if not isinstance(t, dict):
                    continue
                for a in (t.get("do") or []):
                    if not isinstance(a, dict):
                        continue

                    act = a.get("action")
                    if act in {"open_popup", "close_popup", "unlock", "reveal", "set_text"}:
                        if a.get("target_id"):
                            used_targets.add(str(a["target_id"]))

                    if act == "go_to_scene":
                        if a.get("scene_id"):
                            used_scenes.add(str(a["scene_id"]))

                    if act == "branch":
                        for case in (a.get("cases") or []):
                            if isinstance(case, dict) and case.get("scene_id"):
                                used_scenes.add(str(case["scene_id"]))
                        if a.get("default_scene_id"):
                            used_scenes.add(str(a["default_scene_id"]))

                    if act in {"play_sound", "set_audio", "set_image"}:
                        if a.get("asset_id"):
                            used_assets.add(str(a["asset_id"]))

        return used_assets, used_scenes, used_targets

class PageSerializer(serializers.ModelSerializer):
    scenes = SceneSerializer(many=True, read_only=True)
    assets = AssetSerializer(many=True, read_only=True)

    class Meta:
        model = Page
        fields = (
            "id",
            "slug",
            "title",
            "status",
            "password_enabled",
            "expires_at",
            "theme_id",
            "theme_settings",
            "variables",
            "renderer",
            "scenes",
            "assets",
        )


class ClientRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientRequest
        fields = "__all__"


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"
