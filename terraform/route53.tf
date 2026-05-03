resource "aws_route53_zone" "hivebox" {
  name = "hivebox-api.com"
}

resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.hivebox.zone_id
  name    = "api.hivebox-api.com"
  type    = "A"

  alias {
    name                   = aws_lb.hivebox.dns_name
    zone_id                = aws_lb.hivebox.zone_id
    evaluate_target_health = true
  }
}